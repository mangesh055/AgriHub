import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'mr' | 'hi';

export interface Translations {
  [key: string]: {
    en: string;
    mr: string;
    hi?: string;
  };
}

export const DICTIONARY: Translations = {
  // Brand & Header
  appTitle: { en: 'AgriHub', mr: 'अॅग्रीहब' },
  appSubtitle: { en: 'Smart Agricultural Intelligence Platform', mr: 'स्मार्ट कृषी बुद्धिमत्ता व्यासपीठ' },
  roleFarmer: { en: 'Role: FARMER', mr: 'भूमिका: शेतकरी' },
  roleAdmin: { en: 'Role: ADMIN', mr: 'भूमिका: प्रशासक' },
  registerFarm: { en: '+ Register Farm', mr: '+ शेती नोंदवा' },
  logout: { en: 'Logout', mr: 'बाहेर पडा' },
  darkTheme: { en: 'Dark', mr: 'रात्र' },
  lightTheme: { en: 'Light', mr: 'दिवस' },

  // Navigation Items
  navDashboard: { en: 'Dashboard', mr: 'डॅशबोर्ड' },
  navFarms: { en: 'My Farms', mr: 'माझी शेती' },
  navCropPlan: { en: 'Crop Plan', mr: 'पीक नियोजन' },
  navWeather: { en: 'Weather', mr: 'हवामान अंदाज' },
  navIrrigation: { en: 'IoT Irrigation', mr: 'पाणी व सिंचन' },
  navCropHealth: { en: 'Crop Health', mr: 'पीक आरोग्य' },
  navMarket: { en: 'Mandi & Market', mr: 'बाजार भाव (मंडी)' },
  navEconomics: { en: 'Profit & Costs', mr: 'नफा व खर्च' },
  navKnowledge: { en: 'Schemes & Seeds', mr: 'शासकीय योजना' },
  navAssistant: { en: 'AI Agronomist', mr: 'कृषी सल्लागार' },

  // Farm Registration Modal & Onboarding
  farmSetupTitle: { en: 'Farm Plot & Soil Profile Setup', mr: 'शेत जमीन व माती नोंदणी' },
  farmNameLabel: { en: 'Farm Name / Title', mr: 'शेताचे नाव / ओळख' },
  areaAcresLabel: { en: 'Total Land Area (Acres)', mr: 'एकूण क्षेत्र (एकर)' },
  locationSection: { en: '2. Farm Location & Geography', mr: '२. शेताचे ठिकाण व पत्ता' },
  villageLabel: { en: 'Village / Town', mr: 'गाव / शहर' },
  talukaLabel: { en: 'Taluka / Tehsil', mr: 'तालुका' },
  districtLabel: { en: 'District', mr: 'जिल्हा' },
  stateLabel: { en: 'State', mr: 'राज्य' },
  gpsLatLabel: { en: 'GPS Latitude', mr: 'अक्षांश (Latitude)' },
  gpsLngLabel: { en: 'GPS Longitude', mr: 'रेखांश (Longitude)' },
  autoDetectGps: { en: 'Auto-Detect Current GPS', mr: 'सध्याचे GPS शोधा' },
  irrigationSection: { en: '3. Irrigation & Water Sources', mr: '३. सिंचन व पाण्याचे स्रोत' },
  soilReportSection: { en: '4. Soil Health Card / Test Report Upload', mr: '४. मृदा आरोग्य पत्रिका / चाचणी अहवाल' },
  soilTypeSection: { en: '5. Soil Type & Previous Yield History', mr: '५. मातीचा प्रकार व मागील उत्पादन' },
  soilTypeLabel: { en: 'Soil Classification / Type', mr: 'मातीचा प्रकार' },
  previousCropLabel: { en: 'Previous Crop Grown', mr: 'मागील घेतलेले पीक' },
  previousYieldLabel: { en: 'Previous Harvest Yield (Quintals/Acre)', mr: 'मागील उत्पादन (क्विंटल/एकर)' },
  previousSeasonLabel: { en: 'Previous Season', mr: 'मागील हंगाम' },
  soilNutrientsOptional: { en: 'Soil Nutrients & Chemical Metrics (Optional)', mr: 'मातीतील पोषणद्रव्ये (पर्यायी)' },
  saveFarmButton: { en: 'Save & Continue', mr: 'माहिती जतन करा व पुढे जा' },
  cancelButton: { en: 'Cancel', mr: 'रद्द करा' },
  autoFillDemoReport: { en: 'Auto-Fill from Demo Govt Card', mr: 'डेमो शासकीय अहवालावरून भरा' },

  // Water Sources
  dripIrrigation: { en: 'Drip Irrigation (Micro-drip)', mr: 'ठिबक सिंचन (Drip)' },
  borewellSource: { en: 'Borewell / Tube Well', mr: 'बोअरवेल / कूपनलिका' },
  canalSource: { en: 'Canal Flow Water', mr: 'कालव्याचे पाणी' },
  sprinklerSource: { en: 'Sprinkler System', mr: 'तुषार सिंचन (Sprinkler)' },
  openWellSource: { en: 'Open Well / Dug Well', mr: 'विहीर' },
  riverLiftSource: { en: 'River / Lift Irrigation', mr: 'नदी / उपसा सिंचन' },
  farmPondSource: { en: 'Farm Pond / Rainwater Harvesting', mr: 'शेततळे / पाणी साठा' },
  rainfedSource: { en: 'Rainfed (Direct Monsoon)', mr: 'कोरडवाहू / पावसावर अवलंबून' },

  // Soil Classifications
  blackCottonSoil: { en: 'Black Cotton Soil (Regur / Heavy Clay)', mr: 'काळी कसदार माती (रेगूर)' },
  alluvialSoil: { en: 'Alluvial Loam (Fertile River Plains)', mr: 'गाळाची जमीन (सुपीक)' },
  redSoil: { en: 'Red Sandy / Lateritic Soil', mr: 'तांबडी / जांभी माती' },
  clayLoamSoil: { en: 'Clay Loam (Moderate Drainage)', mr: 'चिकण माती (मध्यम निचरा)' },
  sandyLoamSoil: { en: 'Sandy Loam (High Drainage)', mr: 'वालुकामय पोयटा माती' },
  siltyClaySoil: { en: 'Silty Clay', mr: 'गाळाची चिकण माती' },

  // Weather & Live Cards
  weatherTitle: { en: 'Hyperlocal Agro-Meteorological Forecast', mr: 'अचूक कृषी हवामान अंदाज' },
  weatherTabSubtitle: { en: 'Real-time open-source agro-meteorological observations for predictive farming', mr: 'अचूक शेती नियोजनासाठी रीअल-टाइम कृषी हवामान मापदंड व सल्ला' },
  recommendedWeatherInputs: { en: 'Recommended Weather Inputs', mr: 'शिफारस केलेले हवामान मापदंड' },
  colParameter: { en: 'Parameter', mr: 'हवामान मापदंड' },
  colSource: { en: 'Source', mr: 'माहिती स्रोत' },
  colImportance: { en: 'Importance', mr: 'महत्त्व' },
  colUse: { en: 'Use / Application', mr: 'कृषी वापर / उपयोग' },
  colLiveMetric: { en: 'Live Value', mr: 'सध्याचे मोजमाप' },
  colAdvisory: { en: 'Agronomic Guidance', mr: 'कृषी सल्ला व परिणाम' },
  temperature: { en: 'Temperature', mr: 'तापमान' },
  humidity: { en: 'Humidity', mr: 'हवेतील आर्द्रता' },
  rainfall: { en: 'Rainfall', mr: 'पावसाचे प्रमाण' },
  rainProbability: { en: 'Rain Chance', mr: 'पावसाची शक्यता' },
  windSpeed: { en: 'Wind Speed', mr: 'वाऱ्याचा वेग' },
  liveUpdate: { en: 'Live Real-time Update', mr: 'थेट थेट अपडेट' },
  evapotranspiration: { en: 'Reference Evapotranspiration (ET₀)', mr: 'संदर्भ बाष्पीभवन (ET₀)' },
  soilMoisture: { en: 'Soil Moisture', mr: 'मातीतील ओलावा' },
  sevenDayRain: { en: '7-Day Total Rain', mr: '७ दिवसांचा एकूण पाऊस' },
  season: { en: 'Season', mr: 'हंगाम' },
  sprayingAdvisory: { en: 'Chemical Spraying Advisory', mr: 'कीटकनाशक फवारणी सल्ला' },
  safeToSpray: { en: 'Safe for Spraying', mr: 'फवारणीसाठी अनुकूल' },
  unsafeToSpray: { en: 'Unsafe for Spraying', mr: 'फवारणी थांबवा' },
  cautionSpray: { en: 'Caution while Spraying', mr: 'काळजीपूर्वक फवारणी करा' },
  refreshWeather: { en: 'Refresh Live Weather', mr: 'हवामान रिफ्रेश करा' },
  liveOpenMeteoBadge: { en: 'Live Open-Meteo Connected', mr: 'थेट Open-Meteo जोडणी' },
  sevenDayForecastTitle: { en: '7-Day Agricultural Micro-Forecast', mr: 'पुढील ७ दिवसांचे कृषी सूक्ष्म-हवामान' },
  climateAlertsTitle: { en: 'Active Climate Risk Warnings', mr: 'सक्रिय हवामान धोक्याचे इशारे' },
  filterAll: { en: 'All 11 Inputs', mr: 'सर्व ११ मापदंड' },
  filterHigh: { en: 'High Importance', mr: 'उच्च प्राधान्य' },
  filterWater: { en: 'Rain & Evaporation', mr: 'पाणी व बाष्पीभवन' },
  filterTemp: { en: 'Temperature & Heat', mr: 'तापमान व उष्मा' },

  // Farmer Profile Page
  profilePageTitle: { en: 'Farmer Profile & Account', mr: 'शेतकरी प्रोफाइल व खाते' },
  profilePageSubtitle: { en: 'Manage verified farmer identity, farm holding records, location, and account settings', mr: 'तुमची शेतकरी ओळख, शेती नोंदी, गाव/पत्ता आणि प्रणाली सेटिंग्ज व्यवस्थापित करा' },
  backToDashboard: { en: 'Back to Dashboard', mr: 'डॅशबोर्डवर परत जा' },
  verifiedFarmer: { en: 'Verified Farmer', mr: 'प्रमाणित शेतकरी' },
  editProfile: { en: 'Edit Information', mr: 'माहिती संपादन' },
  farmerUid: { en: 'Farmer Profile UID', mr: 'शेतकरी ओळख क्रमांक (UID)' },
  registeredPhone: { en: 'Registered Mobile', mr: 'नोंदणीकृत मोबाईल' },
  accountRole: { en: 'Account Role', mr: 'खाते भूमिका' },
  locationDetails: { en: 'Farm Location & Address', mr: 'पत्ता व गाव तपशील' },
  farmHoldings: { en: 'Registered Land Holdings', mr: 'नोंदणीकृत शेतजमीन व सिंचन' },
  manageFarms: { en: 'Manage Farms', mr: 'शेती व्यवस्थापन' },
  preferences: { en: 'System Preferences', mr: 'प्रणाली प्राधान्ये' },
  saveChanges: { en: 'Save Changes', mr: 'माहिती जतन करा' },
  savingChanges: { en: 'Saving...', mr: 'जतन होत आहे...' },
  cancel: { en: 'Cancel', mr: 'रद्द करा' },
  profileUpdated: { en: 'Profile successfully updated!', mr: 'प्रोफाइल यशस्वीरित्या अद्यतनित झाले!' },

  // Crop Cycle Initiation
  initiateCycle: { en: 'Initiate Crop Cycle', mr: 'पीक चक्र सुरू करा' },
  activeInField: { en: 'Active in Field', mr: 'शेतात सध्या सक्रिय' },
  initiateModalTitle: { en: 'Initiate Field Crop Sowing Cycle', mr: 'शेतात पीक पेरणी चक्र सुरू करा' },
  confirmInitiate: { en: 'Confirm & Start Crop Cycle', mr: 'खात्री करा व पीक चक्र सुरू करा' },
  initiating: { en: 'Initiating...', mr: 'सुरू होत आहे...' },
  sowingDateLabel: { en: 'Sowing Date', mr: 'पेरणीची तारीख' },
  expectedHarvestLabel: { en: 'Expected Harvest Date', mr: 'अपेक्षित काढणी तारीख' },
  cropVarietyLabel: { en: 'Seed Variety / Cultivar', mr: 'बियाणे वाण' },
  cropCycleSuccess: { en: 'Crop cycle successfully initiated!', mr: 'पीक चक्र यशस्वीरित्या सुरू झाले!' },
  currentlyActiveCycle: { en: 'Currently Active Crop Cycle in Field', mr: 'शेतामध्ये सध्या चालू असलेले पीक चक्र' },
  scanLeafHealth: { en: 'Scan Leaf for Disease', mr: 'रोगासाठी पान स्कॅन करा' },
  iotIrrigation: { en: 'IoT Irrigation Guidance', mr: 'IoT सिंचन सल्ला' },

  // Baramati Regional Intelligence
  baramatiRegion: { en: 'Baramati Taluka, Pune District', mr: 'बारामती तालुका, पुणे जिल्हा' },
  researchPartnerTag: { en: 'ICAR-NIASM & KVK Baramati Certified Trials', mr: 'ICAR-NIASM व कृषी विज्ञान केंद्र (KVK) बारामती प्रमाणित' },
  microzoneCanal: { en: 'Canal Command (Nira Left Bank)', mr: 'कालवा लाभ क्षेत्र (नीरा डावा कालवा)' },
  microzoneWell: { en: 'Well & Drip Irrigated Belt', mr: 'विहीर व ठिबक सिंचन पट्टा' },
  microzoneScarcity: { en: 'Rainfed Scarcity Zone (Supa/Morgaon)', mr: 'कोरडवाहू टंचाई पट्टा (सुपा/मोरगाव)' },
  kvkCertifiedVarieties: { en: 'Certified KVK Seed Varieties', mr: 'KVK प्रमाणित बियाणे वाण' },
  abioticStressTradeoffs: { en: 'Abiotic Stress & Field Management Trade-offs', mr: 'हवामान ताण व शेत व्यवस्थापन सल्ला' },
  seasonAnnual: { en: 'Annual (Sugarcane)', mr: 'वार्षिक (ऊस)' }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('agrihub_lang') as Language;
    return saved === 'mr' || saved === 'en' || saved === 'hi' ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agrihub_lang', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const entry = DICTIONARY[key];
    if (!entry) return fallback || key;
    if (language === 'mr' && entry.mr) return entry.mr;
    if (language === 'hi' && entry.hi) return entry.hi;
    return entry.en || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
