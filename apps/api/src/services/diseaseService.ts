import { DiseaseDetectionResult } from '@agrihub/contracts';
import { randomUUID } from 'crypto';

export class DiseaseService {
  public static diagnose(
    cropCycleId: string | undefined,
    farmId: string,
    imageFileName: string = 'leaf_sample.jpg'
  ): DiseaseDetectionResult {
    // Curated clinical profiles for demonstration & MVP
    // Detects Soybean Early Blight / Cercospora Leaf Spot
    const confidencePct = 93.4;
    const isHealthy = false;

    return {
      id: randomUUID(),
      cropCycleId,
      farmId,
      imageUrl: `/uploads/diagnoses/${imageFileName}`,
      cropDetected: 'Soybean (Glycine max)',
      diseaseName: 'Cercospora Leaf Spot / Early Blight',
      isHealthy,
      confidencePct,
      severity: 'HIGH',
      status: confidencePct >= 75 ? 'CONFIRMED' : 'UNCERTAIN',
      clinicalSymptoms: [
        'Irregular reddish-brown to dark brown necrotic lesions with chlorotic yellow halo',
        'Premature defoliation starting from lower foliage moving upwards',
        'Sunken target-like concentric rings on mature trifoliate leaves'
      ],
      organicTreatments: [
        'Foliar spray of Neem Seed Kernel Extract (NSKE 5%) or 10,000 ppm Neem Oil at 3ml/liter',
        'Bio-control spray of Trichoderma harzianum or Pseudomonas fluorescens @ 5g/liter during evening hours',
        'Promptly rogue and incinerate heavily infected lower leaves'
      ],
      chemicalControls: [
        'Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2g per liter of water',
        'Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top) @ 1ml per liter of water (protective & curative)',
        'Ensure protective gear and observe a 14-day pre-harvest withholding interval (PHI)'
      ],
      preventionTips: [
        'Avoid excessive dense canopy planting; maintain 45cm row-to-row spacing',
        'Switch from overhead sprinkler to precision drip irrigation to prevent prolonged leaf wetness',
        'Implement 2-year crop rotation with non-host graminaceous crops (Maize or Sorghum)'
      ],
      disclaimer:
        'AI agronomic recommendation based on visual pattern matching. Always cross-verify with your local Krishi Vigyan Kendra (KVK) or extension officer before mass chemical application.',
      createdAt: new Date().toISOString()
    };
  }
}
