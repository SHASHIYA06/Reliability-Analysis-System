export const DEPOTS = [
  { value: "KMRCL", label: "KMRCL - Kolkata Metro" },
  { value: "BMRCL", label: "BMRCL - Bengaluru Metro" },
  { value: "DMRCL", label: "DMRCL - Delhi Metro" },
  { value: "MMRCL", label: "MMRCL - Mumbai Metro" },
];

export const TRAIN_SETS = [
  "TS01","TS02","TS03","TS04","TS05","TS06","TS07","TS08","TS09",
  "TS10","TS11","TS12","TS13","TS14","TS15","TS16","TS17",
];

export const CAR_NUMBERS = [
  { value: "DMC1", label: "DMC1 - Driving Motor Car 1" },
  { value: "TC1", label: "TC1 - Trailer Car 1" },
  { value: "MC1", label: "MC1 - Motor Car 1" },
  { value: "MC2", label: "MC2 - Motor Car 2" },
  { value: "TC2", label: "TC2 - Trailer Car 2" },
  { value: "DMC2", label: "DMC2 - Driving Motor Car 2" },
];

export const ORDER_TYPES = [
  { value: "CM", label: "CM - Corrective Maintenance" },
  { value: "PM", label: "PM - Preventive Maintenance" },
  { value: "OPM", label: "OPM - Other Planned Maintenance" },
];

export const SERVICE_DISTINCTIONS = [
  { value: "1", label: "1 - No Effect on Service" },
  { value: "2", label: "2 - Changeover" },
  { value: "3", label: "3 - Push Out" },
  { value: "4", label: "4 - Fail to Dispatch" },
  { value: "5", label: "5 - Deboarding" },
  { value: "6", label: "6 - Delay" },
];

export const DELAY_DURATIONS = [
  { value: "less-than-1", label: "Less than 1 Minute" },
  { value: "1-min", label: "1 Minute" },
  { value: "2-min", label: "2 Minutes" },
  { value: "3-min", label: "3 Minutes" },
  { value: "4-min", label: "4 Minutes" },
  { value: "5-min", label: "5 Minutes" },
  { value: "more-than-5", label: "More than 5 Minutes" },
];

export const SERVICE_CHECKS = [
  { value: "A", label: "A Service Check" },
  { value: "B1", label: "B1 Service Check" },
  { value: "B4", label: "B4 Service Check" },
  { value: "B8", label: "B8 Service Check" },
  { value: "C1", label: "C1 Service Check" },
  { value: "C2", label: "C2 Service Check" },
  { value: "C5", label: "C5 Service Check" },
];

export const REPORTING_LOCATIONS = [
  { value: "CPD", label: "CPD Depot" },
  { value: "NOAPARA", label: "Noapara Depot" },
  { value: "MAINLINE", label: "Main Line" },
  { value: "YARD", label: "Yard" },
  { value: "WORKSHOP", label: "Workshop" },
];

export const SYSTEM_TAXONOMY = [
  {
    code: "GEN",
    name: "General",
    subsystems: [
      { code: "GEN-01", name: "General Issue" },
      { code: "GEN-02", name: "Infrastructure" },
    ],
  },
  {
    code: "TRC",
    name: "Traction System",
    subsystems: [
      { code: "TRC-01", name: "Collector Shoes" },
      { code: "TRC-02", name: "HSCB & Earthing Switch" },
      { code: "TRC-03", name: "Traction Inverter" },
      { code: "TRC-04", name: "Traction Motor" },
      { code: "TRC-05", name: "VVVF Drive" },
      { code: "TRC-06", name: "Pantograph" },
      { code: "TRC-07", name: "Others" },
    ],
  },
  {
    code: "BRK",
    name: "Brake System",
    subsystems: [
      { code: "BRK-01", name: "Air Supply Equipment" },
      { code: "BRK-02", name: "Friction Brake Equipment" },
      { code: "BRK-03", name: "Brake Control Unit" },
      { code: "BRK-04", name: "Brake Resistor" },
    ],
  },
  {
    code: "DOR",
    name: "Door System",
    subsystems: [
      { code: "DOR-01", name: "Passenger Door" },
      { code: "DOR-02", name: "Door Control Unit" },
      { code: "DOR-03", name: "Door Locking Mechanism" },
      { code: "DOR-04", name: "Driver Cab Door" },
    ],
  },
  {
    code: "ACS",
    name: "Air Conditioning System",
    subsystems: [
      { code: "ACS-01", name: "Saloon VAC" },
      { code: "ACS-02", name: "Cab VAC" },
      { code: "ACS-03", name: "VAC Control Unit" },
      { code: "ACS-04", name: "Compressor" },
    ],
  },
  {
    code: "BOG",
    name: "Bogie & Suspension",
    subsystems: [
      { code: "BOG-01", name: "Bogie Frame" },
      { code: "BOG-02", name: "Primary Suspension" },
      { code: "BOG-03", name: "Secondary Suspension" },
      { code: "BOG-04", name: "Wheelset" },
      { code: "BOG-05", name: "Bearing" },
    ],
  },
  {
    code: "TIMS",
    name: "Train Integrated Management System",
    subsystems: [
      { code: "TIMS-01", name: "Control Unit" },
      { code: "TIMS-02", name: "Local Unit" },
      { code: "TIMS-03", name: "Car Interface Unit" },
      { code: "TIMS-04", name: "Display Controller" },
      { code: "TIMS-05", name: "Video Display Unit (VDU/TFT)" },
      { code: "TIMS-06", name: "ATP Interface" },
    ],
  },
  {
    code: "COM",
    name: "Communication System",
    subsystems: [
      { code: "COM-01", name: "PA System" },
      { code: "COM-02", name: "PIS (Passenger Information System)" },
      { code: "COM-03", name: "CCTV" },
      { code: "COM-04", name: "Radio System" },
      { code: "COM-05", name: "GSMR" },
    ],
  },
  {
    code: "FDS",
    name: "Fire Detection System",
    subsystems: [
      { code: "FDS-01", name: "Fire Detector" },
      { code: "FDS-02", name: "Fire Control Panel" },
      { code: "FDS-03", name: "Suppression System" },
    ],
  },
  {
    code: "VCS",
    name: "Vehicle Control System",
    subsystems: [
      { code: "VCS-01", name: "VCC (Vehicle Control Computer)" },
      { code: "VCS-02", name: "Propulsion Control" },
      { code: "VCS-03", name: "Brake Control" },
      { code: "VCS-04", name: "Door Control" },
    ],
  },
  {
    code: "AES",
    name: "Auxiliary Electric System",
    subsystems: [
      { code: "AES-01", name: "Auxiliary Converter (APS)" },
      { code: "AES-02", name: "Battery Charger" },
      { code: "AES-03", name: "Back-up Battery" },
      { code: "AES-04", name: "HV Cables & Connectors" },
      { code: "AES-05", name: "LV Distribution" },
    ],
  },
  {
    code: "LGT",
    name: "Lighting System",
    subsystems: [
      { code: "LGT-01", name: "Head Light" },
      { code: "LGT-02", name: "Tail Light" },
      { code: "LGT-03", name: "Saloon Lighting" },
      { code: "LGT-04", name: "Emergency Lighting" },
    ],
  },
  {
    code: "GNG",
    name: "Gangway & Coupler",
    subsystems: [
      { code: "GNG-01", name: "Corrugated Bellows" },
      { code: "GNG-02", name: "Automatic Coupler" },
      { code: "GNG-03", name: "Semi-Permanent Coupler" },
      { code: "GNG-04", name: "Draft Gear" },
    ],
  },
  {
    code: "STR",
    name: "Structure & Interior",
    subsystems: [
      { code: "STR-01", name: "Carbody" },
      { code: "STR-02", name: "Saloon Interior" },
      { code: "STR-03", name: "Exterior Panels" },
      { code: "STR-04", name: "Underframe" },
      { code: "STR-05", name: "Driver Cab" },
    ],
  },
];

export const WITHDRAWAL_SCENARIOS = [
  { code: "W01", description: "Loss of all propulsion power on one train" },
  { code: "W02", description: "Loss of more than 50% of propulsion power" },
  { code: "W03", description: "Complete loss of friction braking on one or more cars" },
  { code: "W04", description: "Friction brake fail to release on one or more bogies" },
  { code: "W05", description: "Loss of all auxiliary power supply" },
  { code: "W06", description: "More than one passenger door fails to close and lock" },
  { code: "W07", description: "Any door opens while train is in motion" },
  { code: "W08", description: "Loss of all VAC in saloon during summer months" },
  { code: "W09", description: "Total failure of TCMS leading to inability to drive" },
  { code: "W10", description: "Failure of PA/PIS preventing driver communication with passengers" },
  { code: "W11", description: "Derailment or severe wheel flat detected" },
  { code: "W12", description: "Severe air leak in main reservoir pipe" },
  { code: "W13", description: "Fire or smoke detected in saloon or underframe" },
  { code: "W14", description: "Coupler failure preventing rescue operations" },
  { code: "W15", description: "Total failure of both headlights" },
  { code: "W16", description: "Failure of driver desk displays (VDU)" },
];

export const BEML_USERS = [
  { id: "BEML/ADMIN/001", name: "SHASHI SHEKHAR MISHRA", password: "9799494321", role: "admin", initials: "SS" },
  { id: "BEML/70147", name: "AKHILESH KUMAR YADAV", password: "AKHILESH@1234", role: "engineer", initials: "AK" },
  { id: "BEML/70153", name: "CHANDAN KUMAR", password: "CHANDAN@1234", role: "engineer", initials: "CK" },
  { id: "BEML/DEO/001", name: "KAUSHIK MONDAL", password: "KAUSHIK@1234", role: "data-entry", initials: "KM" },
  { id: "BEML/OFFICER/001", name: "ARAGHYA KAR", password: "ARAGHYA@1234", role: "officer", initials: "AK" },
  { id: "BEML/OFFICER/002", name: "SHILPA SAHU", password: "SHILPA@1234", role: "officer", initials: "SS" },
  { id: "BEML/OFFICER/003", name: "SHIRSHENDU MAJUMDAR", password: "SHIRSHENDU@1234", role: "officer", initials: "SM" },
  { id: "BEML/OFFICER/004", name: "SUNIL KUMAR RAJAN", password: "SUNIL@1234", role: "officer", initials: "SR" },
];
