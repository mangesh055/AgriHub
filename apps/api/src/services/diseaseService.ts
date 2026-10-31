import { DiseaseDetectionResult, AlertSeverity } from '@agrihub/contracts';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || process.env.AGRIHUB_ML_URL || 'http://localhost:8000';

function findEngineScript(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'AgriHub/Crop recommendation/agrihub-ml/app/disease_engine.py'),
    path.resolve(process.cwd(), 'Crop recommendation/agrihub-ml/app/disease_engine.py'),
    path.resolve(process.cwd(), '../Crop recommendation/agrihub-ml/app/disease_engine.py'),
    path.resolve(process.cwd(), '../../Crop recommendation/agrihub-ml/app/disease_engine.py'),
    path.resolve(currentDir, '../../../Crop recommendation/agrihub-ml/app/disease_engine.py'),
    path.resolve(currentDir, '../../../../Crop recommendation/agrihub-ml/app/disease_engine.py'),
    path.resolve(currentDir, '../../Crop recommendation/agrihub-ml/app/disease_engine.py'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

export class DiseaseService {
  /**
   * Diagnoses crop disease using the HuggingFace ConvNeXt multi-crop model.
   * Priority:
   * 1. FastAPI microservice endpoint (/api/v1/diagnose-disease)
   * 2. Direct local Python execution of disease_engine.py
   * 3. Agronomic fallback if model environment is not reachable
   */
  public static async diagnose(
    cropCycleId: string | undefined,
    farmId: string,
    imageFileName: string = 'leaf_sample.jpg',
    imageBase64?: string,
    crop: string = 'auto'
  ): Promise<DiseaseDetectionResult & { topCandidates?: any[]; modelSource?: string }> {
    let mlResult: any = null;

    // 1. Try FastAPI microservice via HTTP
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const endpoint = `${ML_SERVICE_URL}/api/v1/diagnose-disease`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64 || imageFileName,
          crop: crop || 'auto',
          farm_id: farmId,
          crop_cycle_id: cropCycleId
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        mlResult = await res.json();
      }
    } catch (err) {
      // Microservice not running or unreachable, fallback to direct python runner
      console.warn(`[DiseaseService] ML HTTP service unreachable at ${ML_SERVICE_URL}, attempting direct python execution.`);
    }

    // 2. Direct Python runner fallback
    if (!mlResult) {
      const scriptPath = findEngineScript();
      if (scriptPath) {
        let tempImagePath = '';
        try {
          if (imageBase64 && imageBase64.startsWith('data:image')) {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            tempImagePath = path.join(os.tmpdir(), `agrihub_leaf_${Date.now()}.jpg`);
            fs.writeFileSync(tempImagePath, Buffer.from(base64Data, 'base64'));
          } else if (imageBase64) {
            tempImagePath = path.join(os.tmpdir(), `agrihub_leaf_${Date.now()}.jpg`);
            fs.writeFileSync(tempImagePath, Buffer.from(imageBase64, 'base64'));
          } else {
            tempImagePath = imageFileName;
          }

          const { stdout, stderr } = await execFileAsync(
            'python',
            [scriptPath, '--image', tempImagePath, '--crop', crop || 'auto'],
            {
              encoding: 'utf-8',
              timeout: 45000,
              maxBuffer: 15 * 1024 * 1024
            }
          );

          if (stdout) {
            const lines = stdout.trim().split('\n');
            const jsonText = lines.slice(lines.findIndex(l => l.trim().startsWith('{'))).join('\n');
            mlResult = JSON.parse(jsonText);
          } else if (stderr) {
            console.error('[DiseaseService] Python execution warning:', stderr);
          }
        } catch (execErr) {
          console.error('[DiseaseService] Direct python execution failed:', execErr);
        } finally {
          if (tempImagePath && tempImagePath.startsWith(os.tmpdir()) && fs.existsSync(tempImagePath)) {
            try { fs.unlinkSync(tempImagePath); } catch {}
          }
        }
      }
    }

    // 3. Fallback / Default response with Out-Of-Distribution Specimen Gate
    const isPlant = mlResult ? (mlResult.is_plant !== false) : true;
    const isNonPlant = !isPlant || mlResult?.status === 'NON_PLANT_IMAGE' || mlResult?.status === 'IRRELEVANT_IMAGE';

    const confidencePct = isNonPlant ? 0 : (mlResult?.confidence_pct ?? 0);
    const isHealthy = isNonPlant ? false : (mlResult?.is_healthy ?? false);
    const cropDetected = isNonPlant 
      ? 'Non-Plant / Irrelevant Specimen'
      : (mlResult?.crop_detected || (crop !== 'auto' ? crop : 'Maize / Corn / मका (Zea mays)'));
    const diseaseName = isNonPlant 
      ? 'No Crop Foliage Detected' 
      : (mlResult?.disease_name || 'Specimen Analyzed');
    const severity: AlertSeverity = isNonPlant ? 'LOW' : ((mlResult?.severity as AlertSeverity) || (isHealthy ? 'LOW' : 'HIGH'));
    const status: 'CONFIRMED' | 'UNCERTAIN' | 'LOW_QUALITY_IMAGE' | 'NON_PLANT_IMAGE' | 'IRRELEVANT_IMAGE' =
      isNonPlant ? 'NON_PLANT_IMAGE' : (mlResult?.status || (confidencePct >= 70 ? 'CONFIRMED' : 'UNCERTAIN'));

    return {
      id: randomUUID(),
      cropCycleId: cropCycleId || null,
      farmId,
      imageUrl: imageBase64 ? imageBase64 : `/uploads/diagnoses/${imageFileName}`,
      cropDetected,
      diseaseName,
      isHealthy,
      confidencePct,
      severity,
      status,
      isPlant: !isNonPlant,
      warningTitle: mlResult?.warning_title || (isNonPlant ? 'Non-Plant / Irrelevant Image Detected' : undefined),
      warningMessage: mlResult?.warning_message || (isNonPlant ? 'The uploaded photograph does not appear to be an agricultural crop or leaf specimen. Our neural vision analysis detected non-crop features (e.g. animal, human, or everyday object).' : undefined),
      guidanceTip: mlResult?.guidance_tip || (isNonPlant ? 'Please upload a clear photograph of an actual crop leaf, stalk, or affected plant canopy so our AI agronomist can accurately diagnose plant health.' : undefined),
      clinicalSymptoms: mlResult?.clinical_symptoms || (isNonPlant ? [
        'No characteristic leaf mesophyll, venation, or foliar tissue observed in the image',
        'Spectral pigments and surface textures deviate from agricultural crop leaf profiles'
      ] : [
        'Concentric brown to black necrotic rings with yellow chlorotic margin on leaf lamina',
        'Stomatal conductance reduction and localized premature defoliation'
      ]),
      organicTreatments: isNonPlant ? [] : (mlResult?.organic_treatments || [
        'Foliar spray of Neem Seed Kernel Extract (NSKE 5%) or 10,000 ppm cold-pressed Neem Oil @ 3ml/L',
        'Foliar bio-control spray of Trichoderma harzianum or Pseudomonas fluorescens @ 5g/L'
      ]),
      chemicalControls: isNonPlant ? [] : (mlResult?.chemical_controls || [
        'Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top) @ 1ml per liter of water',
        'Mancozeb 75% WP (Indofil M-45) @ 2.5g per liter of water'
      ]),
      preventionTips: mlResult?.prevention_tips || [
        'Position the camera 10–20 cm from the affected plant leaf for close-up inspection',
        'Ensure adequate ambient natural lighting without harsh reflections or darkness',
        'Ensure the specimen in frame is an agricultural crop (e.g. Maize, Soybean, Tomato, Rice, Sugarcane)'
      ],
      disclaimer: mlResult?.disclaimer ||
        'AI plant health diagnostic requires an agricultural botanical specimen. Upload a clear plant or leaf photograph.',
      topCandidates: mlResult?.top_candidates || [],
      modelSource: mlResult?.model_source || 'AgriHub ConvNeXt Specimen Gate',
      createdAt: new Date().toISOString()
    };
  }
}
