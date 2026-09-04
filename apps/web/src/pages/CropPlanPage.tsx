import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Droplets,
  Calendar,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Sprout,
  ScanLine,
  X,
  Check,
  AlertCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FarmRequiredModal } from '../components/FarmRequiredModal';

export const CropPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasFarm, primaryFarm, refreshAuth } = useAuth();
  const { language, t } = useLanguage();
  const isMr = language === 'mr';

  const [showFarmModal, setShowFarmModal] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [cropCycles, setCropCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'KHARIF' | 'RABI' | 'ZAID'>('KHARIF');

  // Initiate Modal States
  const [selectedCrop, setSelectedCrop] = useState<any | null>(null);
  const [varietyInput, setVarietyInput] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [currentStage, setCurrentStage] = useState('SOWING');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeFarmId = primaryFarm?.id || '33333333-3333-3333-3333-333333333333';

  async function loadData() {
    try {
      setLoading(true);
      const [recs, cycles] = await Promise.all([
        api.getCropRecommendations(activeFarmId, activeTab).catch((err) => {
          console.warn('Crop rec fetch error:', err);
          return null;
        }),
        api.getCropCycles(activeFarmId).catch((err) => {
          console.warn('Crop cycles fetch error:', err);
          return [];
        })
      ]);

      if (recs) setRecommendations(recs);
      if (cycles) setCropCycles(cycles);
    } catch (err) {
      console.error('Error loading crop plan data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab, activeFarmId]);

  // Find the primary active crop cycle if one exists
  const activeCycle = cropCycles.find((c) => c.status === 'ACTIVE') || (cropCycles.length > 0 ? cropCycles[0] : null);

  // Compute days since sowing for active cycle
  let daysSinceSowing = 1;
  let totalDurationDays = 95;
  if (activeCycle) {
    if (activeCycle.sowingDate) {
      const sowTime = new Date(activeCycle.sowingDate).getTime();
      const nowTime = new Date().getTime();
      daysSinceSowing = Math.max(1, Math.floor((nowTime - sowTime) / (1000 * 60 * 60 * 24)));
    }
    if (activeCycle.expectedHarvestDate && activeCycle.sowingDate) {
      const sowTime = new Date(activeCycle.sowingDate).getTime();
      const harvestTime = new Date(activeCycle.expectedHarvestDate).getTime();
      const diff = Math.floor((harvestTime - sowTime) / (1000 * 60 * 60 * 24));
      if (diff > 0) totalDurationDays = diff;
    }
  }

  const handleOpenInitiateModal = (item: any) => {
    if (!hasFarm && !primaryFarm) {
      setShowFarmModal(true);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const duration = item.durationDays || 95;
    const targetDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Extract variety from crop name if in parentheses
    let extractedVariety = 'High-Yield Certified';
    const match = item.cropName.match(/\((.*?)\)/);
    if (match && match[1]) {
      extractedVariety = match[1].split('/')[0].trim();
    }

    setSelectedCrop(item);
    setVarietyInput(extractedVariety);
    setSowingDate(todayStr);
    setExpectedHarvestDate(targetDate);
    setCurrentStage('SOWING');
    setErrorMessage(null);
  };

  const handleConfirmInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload = {
        cropName: selectedCrop.cropName,
        variety: varietyInput.trim() || 'High-Yield Certified',
        sowingDate,
        expectedHarvestDate,
        currentStage: currentStage || 'SOWING'
      };

      const created = await api.createCropCycle(activeFarmId, payload);

      // Dynamically update active crop cycles state
      setCropCycles((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      setSelectedCrop(null);

      setSuccessMessage(
        isMr
          ? `🌱 ${selectedCrop.cropName} पिकाचे चक्र यशस्वीरित्या सुरू झाले! आता वाढीच्या टप्प्यांवर लक्ष ठेवले जात आहे.`
          : `🌱 Crop cycle for ${selectedCrop.cropName} successfully initiated! Now tracking phenological growth stages.`
      );

      // Refresh auth to synchronize primary farm context if needed
      refreshAuth();

      // Clear success notification after 6 seconds
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error('Failed to initiate crop cycle:', err);
      setErrorMessage(err?.message || 'Failed to initiate crop cycle. Please verify farm connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={18} color="#10b981" />
            <span style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
              {isMr ? 'मल्टी-फॅक्टर कृषी एआय मॉडेल' : 'Multi-Factor Agronomic AI Model'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            {isMr ? 'पेरणीपूर्व पीक बुद्धिमत्ता व शिफारसी' : 'Pre-Sowing Crop Intelligence & Recommendations'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
            {isMr
              ? 'तुमची काळी कसदार माती, ठिबक सिंचन क्षमता आणि कृषी उत्पन्न बाजार समिती (APMC) नफ्यावर आधारित निवडक पिके.'
              : 'Ranked crops synthesized from your soil fertility metrics, irrigation capacity, and regional APMC market margins.'}
          </p>
        </div>

        {/* Season Selector */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          {(['KHARIF', 'RABI', 'ZAID'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === s ? '#10b981' : 'transparent',
                color: activeTab === s ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              {s === 'KHARIF' ? (isMr ? 'खरीप हंगाम' : 'Kharif Season') : s === 'RABI' ? (isMr ? 'रब्बी हंगाम' : 'Rabi Season') : (isMr ? 'उन्हाळी (झैद)' : 'Zaid Season')}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Success Alert Banner */}
      {successMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            marginBottom: '24px',
            fontSize: '0.95rem',
            fontWeight: 700
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#10b981" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* 1. DYNAMIC ACTIVE CROP CYCLE STATUS CARD (Appears when active cycle exists) */}
      {activeCycle && (
        <section
          className="glass-panel"
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-card) 100%)',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}
              >
                <Sprout size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#34d399', letterSpacing: '0.05em' }}>
                    {t('currentlyActiveCycle', 'Currently Active Crop Cycle in Field')}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
                    {activeCycle.currentStage || 'SOWING'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-heading)' }}>
                  {activeCycle.cropName} {activeCycle.variety ? `(${activeCycle.variety})` : ''}
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                to="/crop-health"
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  textDecoration: 'none'
                }}
              >
                <ScanLine size={15} color="#38bdf8" />
                <span>{t('scanLeafHealth', 'Scan Leaf for Disease')}</span>
              </Link>
              <Link
                to="/irrigation"
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  textDecoration: 'none'
                }}
              >
                <Droplets size={15} color="#059669" />
                <span>{t('iotIrrigation', 'IoT Irrigation Guidance')}</span>
              </Link>
            </div>
          </div>

          {/* Progress Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {isMr ? 'पेरणीपासूनचे दिवस (Days Active)' : 'Days Since Sowing'}
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                Day {daysSinceSowing}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  of {totalDurationDays} Days
                </span>
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {isMr ? 'पेरणी तारीख' : 'Sowing Date'}
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="#0284c7" />
                <span>{activeCycle.sowingDate || 'Recently Sown'}</span>
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {isMr ? 'अपेक्षित काढणी तारीख' : 'Projected Harvest Date'}
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#d97706" />
                <span>{activeCycle.expectedHarvestDate || 'Estimated 90 Days'}</span>
              </div>
            </div>
          </div>

          {/* Growth Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              <span>Sowing (पेरणी)</span>
              <span>Vegetative (शाकीय वाढ)</span>
              <span>Flowering (फुलधारणा)</span>
              <span>Harvest (काढणी)</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.round((daysSinceSowing / totalDurationDays) * 100))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #34d399)',
                  borderRadius: '5px',
                  transition: 'width 0.5s ease-in-out'
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* 2. MAIN RECOMMENDATIONS GRID */}
      {!hasFarm && !primaryFarm ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Compass size={30} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            {isMr ? 'पीक नियोजनासाठी शेती व मातीची माहिती आवश्यक' : 'Farm & Soil Data Required for Crop Planning'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '560px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            {isMr
              ? 'आमचे मल्टी-फॅक्टर अल्गोरिदम मातीचा सामू (pH), NPK पोषणद्रव्ये आणि सिंचन सुविधा तपासून पिकांची क्रमवारी ठरवते. कृपया शिफारसी पाहण्यासाठी शेतीची नोंदणी करा.'
              : 'Our multi-factor agronomic algorithm calculates suitability scores by cross-referencing soil pH, NPK nutrients, and irrigation infrastructure.'}
          </p>
          <button className="btn-primary" onClick={() => setShowFarmModal(true)}>
            <span>{isMr ? 'शेताचे तपशील भरा' : 'Enter Farm & Soil Parameters'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '14px' }} />
          <div>{isMr ? 'माती विश्लेषण आणि बाजार शिफारसी मोजत आहे...' : 'Evaluating soil chemistry, agro-climatic zone, and market projections...'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {recommendations?.recommendations?.map((item: any, idx: number) => {
            const isTopMatch = idx === 0;
            // Check if this crop is currently active in the field
            const isCurrentlyActive =
              activeCycle &&
              activeCycle.cropName.toLowerCase().includes(item.cropName.split(' ')[0].toLowerCase());

            return (
              <div
                key={item.cropName}
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-md)',
                  border: isCurrentlyActive
                    ? '2px solid #059669'
                    : isTopMatch
                    ? '1px solid rgba(16, 185, 129, 0.45)'
                    : '1px solid var(--border-subtle)',
                  background: isCurrentlyActive
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, var(--bg-card) 100%)'
                    : isTopMatch
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-card) 100%)'
                    : 'var(--bg-glass)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* Header Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Rank #{idx + 1} {isMr ? 'शिफारस' : 'Recommendation'}
                  </span>
                  {isCurrentlyActive ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 800
                      }}
                    >
                      <CheckCircle2 size={13} />
                      {t('activeInField', 'Active in Field')}
                    </span>
                  ) : isTopMatch ? (
                    <span className="badge badge-success">
                      {isMr ? 'सर्वोच्च कृषी जुळणी' : 'Top Agronomic Match'}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--text-heading)' }}>
                    {item.cropName}
                  </h3>

                  {/* Suitability Score Gauge */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981' }}>
                      {item.suitabilityScore}%
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {isMr ? 'एकूण अनुकूलता निर्देशांक' : 'Overall Compatibility Index'}
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: `${item.suitabilityScore}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                        borderRadius: '4px'
                      }}
                    />
                  </div>

                  {/* Vital Statistics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <Calendar size={13} />
                        <span>{isMr ? 'कालावधी' : 'Crop Duration'}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.durationDays} {isMr ? 'दिवस' : 'Days'}</span>
                    </div>

                    <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <Droplets size={13} color="#38bdf8" />
                        <span>{isMr ? 'पाण्याची गरज' : 'Water Need'}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#38bdf8' }}>{item.waterRequirement}</span>
                    </div>

                    <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <TrendingUp size={13} color="#10b981" />
                        <span>{isMr ? 'अंदाजे उत्पादन' : 'Est. Yield'}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{item.estimatedYieldRange}</span>
                    </div>

                    <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <Compass size={13} color="#fbbf24" />
                        <span>{isMr ? 'अपेक्षित परतावा' : 'Projected ROI'}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fbbf24' }}>+{item.projectedRoiPct}%</span>
                    </div>
                  </div>

                  {/* Agronomic Match Reasons */}
                  <div style={{ marginBottom: '22px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {isMr ? 'हे पीक तुमच्या शेतीसाठी का योग्य आहे:' : 'Why this crop matches your farm:'}
                    </span>
                    <ul style={{ listStyle: 'none', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {item.matchReasons.map((reason: string, rIdx: number) => (
                        <li key={rIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                          <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* DYNAMIC ACTION BUTTON */}
                <div style={{ paddingTop: '10px' }}>
                  {isCurrentlyActive ? (
                    <button
                      className="btn-secondary"
                      style={{
                        width: '100%',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderColor: '#10b981',
                        color: '#10b981',
                        fontWeight: 700
                      }}
                      onClick={() => navigate('/')}
                    >
                      <CheckCircle2 size={16} />
                      <span>{isMr ? 'सक्रिय पीक सुरू आहे (डॅशबोर्ड पहा)' : 'Active In Field (View on Dashboard)'}</span>
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{
                        width: '100%',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenInitiateModal(item)}
                    >
                      <span>{isMr ? `${item.cropName.split(' ')[0]} पीक चक्र सुरू करा` : `Initiate ${item.cropName.split(' ')[0]} Crop Cycle`}</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. DYNAMIC INITIATE CROP CYCLE MODAL DIALOG */}
      {selectedCrop && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            padding: '20px'
          }}
          onClick={() => !submitting && setSelectedCrop(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              color: 'var(--text-main)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(5, 150, 105, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Sprout size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                    {t('initiateModalTitle', 'Initiate Field Crop Sowing Cycle')}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {primaryFarm?.name || 'Primary Farm Plot'} ({primaryFarm?.areaAcres || 5.5} {isMr ? 'एकर' : 'Acres'})
                  </span>
                </div>
              </div>

              <button
                onClick={() => !submitting && setSelectedCrop(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body & Form */}
            <form onSubmit={handleConfirmInitiate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontSize: '0.85rem' }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Selected Crop Identity Summary */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--color-primary-subtle)', border: '1px solid rgba(5, 150, 105, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {isMr ? 'निवडलेले पीक' : 'Selected Agronomic Crop'}
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                    {selectedCrop.cropName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {isMr ? 'अपेक्षित कालावधी' : 'Duration'}
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>
                    {selectedCrop.durationDays} {isMr ? 'दिवस' : 'Days'}
                  </div>
                </div>
              </div>

              {/* Cultivar / Variety Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {t('cropVarietyLabel', 'Seed Variety / Cultivar')}
                </label>
                <input
                  type="text"
                  value={varietyInput}
                  onChange={(e) => setVarietyInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px' }}
                  required
                  placeholder="e.g. JS-335 / NRC-37"
                />
              </div>

              {/* Dates Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {t('sowingDateLabel', 'Sowing Date')}
                  </label>
                  <input
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '9px 12px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {t('expectedHarvestLabel', 'Expected Harvest Date')}
                  </label>
                  <input
                    type="date"
                    value={expectedHarvestDate}
                    onChange={(e) => setExpectedHarvestDate(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '9px 12px' }}
                    required
                  />
                </div>
              </div>

              {/* Initial Growth Stage Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {isMr ? 'सुरुवातीचा वाढीचा टप्पा (Growth Stage)' : 'Initial Crop Growth Stage'}
                </label>
                <select
                  value={currentStage}
                  onChange={(e) => setCurrentStage(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px' }}
                >
                  <option value="SOWING">SOWING (पेरणी टप्पा)</option>
                  <option value="VEGETATIVE">VEGETATIVE (शाकीय वाढ टप्पा)</option>
                  <option value="FLOWERING">FLOWERING (फुलधारणा टप्पा)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: '11px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>{t('initiating', 'Initiating...')}</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>{t('confirmInitiate', 'Confirm & Start Crop Cycle')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setSelectedCrop(null)}
                  className="btn btn-secondary"
                  style={{ padding: '11px 18px', fontSize: '0.92rem' }}
                >
                  {t('cancel', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Just-In-Time Farm Modal */}
      <FarmRequiredModal
        isOpen={showFarmModal}
        featureName="AI Crop Recommendation"
        featureDescription="Enter your farm acreage, irrigation method, and soil health card parameters to generate personalized crop rankings."
        onCancel={() => setShowFarmModal(false)}
        onSuccess={() => {
          setShowFarmModal(false);
          refreshAuth();
          loadData();
        }}
      />
    </div>
  );
};
