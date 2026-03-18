export const DEPOTS = [
  { value: "KMRCL", label: "KMRCL - Kolkata Metro" },
  { value: "BMRCL", label: "BMRCL - Bengaluru Metro" },
  { value: "DMRCL", label: "DMRCL - Delhi Metro" },
  { value: "MMRCL", label: "MMRCL - Mumbai Metro" },
];

export const TRAIN_NUMBERS = [
  "MR601", "MR602", "MR603", "MR604", "MR605", "MR606", "MR607", "MR608", "MR609",
  "MR610", "MR611", "MR612", "MR613", "MR614", "MR615", "MR616", "MR617",
];

export const TRAIN_SETS = [
  "TS01", "TS02", "TS03", "TS04", "TS05", "TS06", "TS07", "TS08", "TS09",
  "TS10", "TS11", "TS12", "TS13", "TS14", "TS15", "TS16", "TS17",
];

export const TRAIN_NUMBER_TO_SET: Record<string, string> = {
  MR601: "TS01", MR602: "TS02", MR603: "TS03", MR604: "TS04", MR605: "TS05",
  MR606: "TS06", MR607: "TS07", MR608: "TS08", MR609: "TS09", MR610: "TS10",
  MR611: "TS11", MR612: "TS12", MR613: "TS13", MR614: "TS14", MR615: "TS15",
  MR616: "TS16", MR617: "TS17",
};

export const CAR_NUMBERS = [
  { value: "DMC1", label: "1104 - DMC1 (Driving Motor Car 1)" },
  { value: "MC1", label: "3104 - MC1  (Motor Car 1)" },
  { value: "TC1", label: "2104 - TC1  (Trailer Car 1)" },
  { value: "TC2", label: "2204 - TC2  (Trailer Car 2)" },
  { value: "MC2", label: "3204 - MC2  (Motor Car 2)" },
  { value: "DMC2", label: "1204 - DMC2 (Driving Motor Car 2)" },
];

export const CAR_PREFIX: Record<string, string> = {
  DMC1: "1104", MC1: "3104", TC1: "2104", TC2: "2204", MC2: "3204", DMC2: "1204",
};

export const ORDER_TYPES = [
  { value: "CM", label: "CM - Corrective Maintenance" },
  { value: "PM", label: "PM - Preventive Maintenance" },
  { value: "OPM", label: "OPM - Other Planned Maintenance" },
];

export const JOB_OPERATING_CONDITIONS = [
  { value: "Normal", label: "1. Normal" },
  { value: "Abnormal", label: "2. Abnormal" },
  { value: "Emergency", label: "3. Emergency" },
];

export const SERVICE_DISTINCTIONS = [
  { value: "1", label: "1. No Effect on Service" },
  { value: "2", label: "2. Changeover" },
  { value: "3", label: "3. Push Out" },
  { value: "4", label: "4. Fail to Dispatch" },
  { value: "5", label: "5. Deboarding" },
  { value: "6", label: "6. Delay" },
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

export const FAILURE_LOCATIONS = [
  { value: "RH1", label: "RH1" },
  { value: "RH2", label: "RH2" },
  { value: "LH1", label: "LH1" },
  { value: "LH2", label: "LH2" },
  { value: "1ST", label: "1st" },
  { value: "2ND", label: "2nd" },
  { value: "3RD", label: "3rd" },
  { value: "4TH", label: "4th" },
];

export const FAILURE_CATEGORIES = [
  { value: "1", label: "1. System Design (HECP/SECP)" },
  { value: "2", label: "2. Software Error" },
  { value: "3", label: "3. Equipment/Component Failure — Itself" },
  { value: "4", label: "4. Equipment/Component Failure — NFF (replaced as suspected)" },
  { value: "5", label: "5. Poor Workmanship" },
  { value: "6", label: "6. Loose Wire and Connector" },
  { value: "7", label: "7. NFF (MCB tripped)" },
  { value: "8", label: "8. NFF (System hang-up)" },
  { value: "9", label: "9. NFF (Others)" },
  { value: "10", label: "10. Incorrect Operation & Maintenance of Equipment" },
  { value: "11", label: "11. Failure due to External Factor" },
  { value: "12", label: "12. Others (Service Check & Unscheduled Maintenance)" },
];

export const EFFECTS_ON_SERVICE = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const SYSTEM_TAXONOMY = [
  {
    code: "GEN",
    name: "General",
    subsystems: [
      {
        code: "GEN-01", name: "General Issue",
        equipments: [
          { code: "GEN-01-01", name: "General", components: ["General Component"] },
        ],
      },
      {
        code: "GEN-02", name: "Infrastructure",
        equipments: [
          { code: "GEN-02-01", name: "Track Infrastructure", components: ["Rail", "Sleeper", "Ballast"] },
        ],
      },
    ],
  },
  {
    code: "TRC",
    name: "Traction System",
    subsystems: [
      {
        code: "TRC-01", name: "Collector Shoes",
        equipments: [
          { code: "TRC-01-01", name: "Third Rail Shoe", components: ["Carbon Insert", "Shoe Holder", "Mounting Bracket"] },
          { code: "TRC-01-02", name: "Shoe Collector Assembly", components: ["Shunt", "Cable", "Clamp"] },
        ],
      },
      {
        code: "TRC-02", name: "HSCB & Earthing Switch",
        equipments: [
          { code: "TRC-02-01", name: "High Speed Circuit Breaker", components: ["Contact", "Coil", "Housing"] },
          { code: "TRC-02-02", name: "Earthing Switch", components: ["Switch Blade", "Actuator", "Position Sensor"] },
        ],
      },
      {
        code: "TRC-03", name: "Traction Inverter",
        equipments: [
          { code: "TRC-03-01", name: "VVVF Inverter", components: ["IGBT Module", "Gate Driver", "Capacitor", "Cooling Fan"] },
          { code: "TRC-03-02", name: "Inverter Controller", components: ["PCB", "Sensor", "Connector"] },
        ],
      },
      {
        code: "TRC-04", name: "Traction Motor",
        equipments: [
          { code: "TRC-04-01", name: "Induction Motor", components: ["Stator Winding", "Rotor", "Bearing", "Encoder"] },
          { code: "TRC-04-02", name: "Motor Coupling", components: ["Gear Coupling", "Flexible Disk"] },
        ],
      },
      { code: "TRC-05", name: "VVVF Drive", equipments: [{ code: "TRC-05-01", name: "Drive Unit", components: ["Drive PCB", "Power Module"] }] },
      { code: "TRC-07", name: "Others", equipments: [{ code: "TRC-07-01", name: "Others", components: ["Miscellaneous"] }] },
    ],
  },
  {
    code: "BRK",
    name: "Brake System",
    subsystems: [
      {
        code: "BRK-01", name: "Air Supply Equipment",
        equipments: [
          { code: "BRK-01-01", name: "Motor Compressor", components: ["Motor", "Compressor Unit", "Filter", "Belt"] },
          { code: "BRK-01-02", name: "Main Reservoir", components: ["Cylinder", "Safety Valve", "Drain Valve"] },
          { code: "BRK-01-03", name: "Air Dryer", components: ["Desiccant Cartridge", "Valve"] },
        ],
      },
      {
        code: "BRK-02", name: "Friction Brake Equipment",
        equipments: [
          { code: "BRK-02-01", name: "Brake Caliper", components: ["Pads", "Cylinder", "Adjuster"] },
          { code: "BRK-02-02", name: "Brake Disc", components: ["Disc", "Hub", "Bolt"] },
          { code: "BRK-02-03", name: "Brake Cylinder", components: ["Piston", "Seal", "Spring"] },
        ],
      },
      {
        code: "BRK-03", name: "Brake Control Unit",
        equipments: [
          { code: "BRK-03-01", name: "Electropneumatic Valve", components: ["Valve Body", "Solenoid", "O-ring"] },
          { code: "BRK-03-02", name: "Brake Control Computer", components: ["PCB", "Sensor", "Connector"] },
        ],
      },
      { code: "BRK-04", name: "Brake Resistor", equipments: [{ code: "BRK-04-01", name: "Dynamic Brake Resistor", components: ["Resistor Element", "Fan", "Housing"] }] },
    ],
  },
  {
    code: "DOR",
    name: "Door System",
    subsystems: [
      {
        code: "DOR-01", name: "Saloon Door",
        equipments: [
          { code: "DOR-01-01", name: "Door Leaf Assembly", components: ["Door Leaf", "Glazing", "Seal"] },
          { code: "DOR-01-02", name: "Door Drive Unit", components: ["Motor", "Gear", "Belt", "Pulley"] },
          { code: "DOR-01-03", name: "Door Lock", components: ["Latch", "Actuator", "Sensor"] },
        ],
      },
      {
        code: "DOR-02", name: "Door Control Unit",
        equipments: [
          { code: "DOR-02-01", name: "DCU PCB", components: ["PCB", "Relay", "Connector"] },
          { code: "DOR-02-02", name: "Door Sensor", components: ["Open Sensor", "Close Sensor", "Cable"] },
        ],
      },
      {
        code: "DOR-03", name: "Door Locking Mechanism",
        equipments: [
          { code: "DOR-03-01", name: "Electro-mechanical Lock", components: ["Lock Bolt", "Solenoid", "Position Switch"] },
        ],
      },
      { code: "DOR-04", name: "Driver Cab Door", equipments: [{ code: "DOR-04-01", name: "Cab Door Assembly", components: ["Door Leaf", "Lock", "Handle"] }] },
    ],
  },
  {
    code: "ACS",
    name: "Air Conditioning System",
    subsystems: [
      {
        code: "ACS-01", name: "Saloon VAC",
        equipments: [
          { code: "ACS-01-01", name: "HVAC Unit (Rooftop)", components: ["Compressor", "Condenser", "Evaporator", "Blower"] },
          { code: "ACS-01-02", name: "Fresh Air Unit", components: ["Fan", "Filter", "Damper"] },
        ],
      },
      {
        code: "ACS-02", name: "Cab VAC",
        equipments: [
          { code: "ACS-02-01", name: "Cab HVAC Unit", components: ["Compressor", "Condenser", "Blower"] },
        ],
      },
      {
        code: "ACS-03", name: "VAC Control Unit",
        equipments: [
          { code: "ACS-03-01", name: "VAC Controller PCB", components: ["PCB", "Temperature Sensor", "Relay"] },
        ],
      },
      { code: "ACS-04", name: "Compressor", equipments: [{ code: "ACS-04-01", name: "AC Compressor", components: ["Scroll", "Motor", "Oil Separator"] }] },
    ],
  },
  {
    code: "BOG",
    name: "Bogie & Suspension",
    subsystems: [
      {
        code: "BOG-01", name: "Bogie Frame",
        equipments: [
          { code: "BOG-01-01", name: "Bogie Frame Assembly", components: ["Side Frame", "Cross Member", "Weld"] },
        ],
      },
      {
        code: "BOG-02", name: "Primary Suspension",
        equipments: [
          { code: "BOG-02-01", name: "Primary Spring", components: ["Coil Spring", "Damper", "Mounting Rubber"] },
        ],
      },
      {
        code: "BOG-03", name: "Secondary Suspension",
        equipments: [
          { code: "BOG-03-01", name: "Air Spring", components: ["Air Bellows", "Levelling Valve", "Height Sensor"] },
        ],
      },
      {
        code: "BOG-04", name: "Wheelset",
        equipments: [
          { code: "BOG-04-01", name: "Wheel Assembly", components: ["Wheel", "Axle", "Bearing", "Gear Box"] },
        ],
      },
      { code: "BOG-05", name: "Bearing", equipments: [{ code: "BOG-05-01", name: "Axle Box Bearing", components: ["Bearing Inner Ring", "Outer Ring", "Cage"] }] },
    ],
  },
  {
    code: "TIMS",
    name: "Train Integrated Management System",
    subsystems: [
      { code: "TIMS-01", name: "Control Unit", equipments: [{ code: "TIMS-01-01", name: "TCMS Central Unit", components: ["CPU Board", "Power Supply", "Memory Card"] }] },
      { code: "TIMS-02", name: "Local Unit", equipments: [{ code: "TIMS-02-01", name: "TCMS Local Unit", components: ["CPU Board", "I/O Module", "Connector"] }] },
      { code: "TIMS-03", name: "Car Interface Unit", equipments: [{ code: "TIMS-03-01", name: "CIU Assembly", components: ["PCB", "Relay", "Wiring"] }] },
      { code: "TIMS-04", name: "Display Controller", equipments: [{ code: "TIMS-04-01", name: "Display Controller", components: ["PCB", "Backlight", "Connector"] }] },
      { code: "TIMS-05", name: "Video Display Unit (VDU/TFT)", equipments: [{ code: "TIMS-05-01", name: "VDU Monitor", components: ["LCD Panel", "Touch Screen", "Housing"] }] },
      { code: "TIMS-06", name: "ATP Interface", equipments: [{ code: "TIMS-06-01", name: "ATP Interface Unit", components: ["PCB", "Relay", "Cable"] }] },
    ],
  },
  {
    code: "COM",
    name: "Communication System",
    subsystems: [
      { code: "COM-01", name: "PA System", equipments: [{ code: "COM-01-01", name: "PA Amplifier", components: ["Amplifier Unit", "Speaker", "Microphone"] }] },
      { code: "COM-02", name: "PIS (Passenger Information System)", equipments: [{ code: "COM-02-01", name: "PIS Display", components: ["LED/LCD Panel", "Controller", "Wiring"] }] },
      { code: "COM-03", name: "CCTV", equipments: [{ code: "COM-03-01", name: "CCTV Camera", components: ["Camera", "DVR", "Cable", "Connector"] }] },
      { code: "COM-04", name: "Radio System", equipments: [{ code: "COM-04-01", name: "Radio Unit", components: ["Transceiver", "Antenna", "Connector"] }] },
      { code: "COM-05", name: "GSMR", equipments: [{ code: "COM-05-01", name: "GSM-R Unit", components: ["Module", "Antenna", "SIM"] }] },
    ],
  },
  {
    code: "FDS",
    name: "Fire Detection System",
    subsystems: [
      { code: "FDS-01", name: "Fire Detector", equipments: [{ code: "FDS-01-01", name: "Smoke Detector", components: ["Sensor Head", "Base", "Wiring"] }] },
      { code: "FDS-02", name: "Fire Control Panel", equipments: [{ code: "FDS-02-01", name: "Fire Alarm Panel", components: ["PCB", "Relay", "Display"] }] },
      { code: "FDS-03", name: "Suppression System", equipments: [{ code: "FDS-03-01", name: "Fire Extinguisher", components: ["Cylinder", "Valve", "Nozzle"] }] },
    ],
  },
  {
    code: "VCS",
    name: "Vehicle Control System",
    subsystems: [
      { code: "VCS-01", name: "VCC (Vehicle Control Computer)", equipments: [{ code: "VCS-01-01", name: "VCC Unit", components: ["CPU", "I/O Board", "Power Supply"] }] },
      { code: "VCS-02", name: "Propulsion Control", equipments: [{ code: "VCS-02-01", name: "Propulsion Controller", components: ["PCB", "Sensor", "Relay"] }] },
      { code: "VCS-03", name: "Brake Control", equipments: [{ code: "VCS-03-01", name: "Brake Controller", components: ["PCB", "Pressure Sensor", "Valve"] }] },
      { code: "VCS-04", name: "Door Control", equipments: [{ code: "VCS-04-01", name: "Door Controller", components: ["PCB", "Switch", "Relay"] }] },
    ],
  },
  {
    code: "AES",
    name: "Auxiliary Electric System",
    subsystems: [
      { code: "AES-01", name: "Auxiliary Converter (APS)", equipments: [{ code: "AES-01-01", name: "Auxiliary Converter", components: ["Inverter Module", "Transformer", "Filter"] }] },
      { code: "AES-02", name: "Battery Charger", equipments: [{ code: "AES-02-01", name: "Battery Charger Unit", components: ["Charging PCB", "Transformer", "Relay"] }] },
      { code: "AES-03", name: "Back-up Battery", equipments: [{ code: "AES-03-01", name: "NiCd Battery Bank", components: ["Cell", "Battery Tray", "Terminal"] }] },
      { code: "AES-04", name: "HV Cables & Connectors", equipments: [{ code: "AES-04-01", name: "HV Cable Assembly", components: ["Cable", "Connector", "Terminal Lug"] }] },
      { code: "AES-05", name: "LV Distribution", equipments: [{ code: "AES-05-01", name: "LV Distribution Box", components: ["MCB", "Fuse", "Bus Bar"] }] },
    ],
  },
  {
    code: "LGT",
    name: "Lighting System",
    subsystems: [
      { code: "LGT-01", name: "Head Light", equipments: [{ code: "LGT-01-01", name: "Headlight Assembly", components: ["LED Module", "Housing", "Lens"] }] },
      { code: "LGT-02", name: "Tail Light", equipments: [{ code: "LGT-02-01", name: "Tail Light Assembly", components: ["LED Module", "Housing", "Lens"] }] },
      { code: "LGT-03", name: "Saloon Lighting", equipments: [{ code: "LGT-03-01", name: "Saloon LED Panel", components: ["LED Strip", "Diffuser", "Driver"] }] },
      { code: "LGT-04", name: "Emergency Lighting", equipments: [{ code: "LGT-04-01", name: "Emergency Light Unit", components: ["LED", "Battery", "Driver"] }] },
    ],
  },
  {
    code: "GNG",
    name: "Gangway & Coupler",
    subsystems: [
      { code: "GNG-01", name: "Corrugated Bellows", equipments: [{ code: "GNG-01-01", name: "Gangway Bellows", components: ["Bellows", "Frame", "Seal"] }] },
      { code: "GNG-02", name: "Automatic Coupler", equipments: [{ code: "GNG-02-01", name: "Auto Coupler Head", components: ["Coupler Head", "Draft Gear", "Uncoupling Device"] }] },
      { code: "GNG-03", name: "Semi-Permanent Coupler", equipments: [{ code: "GNG-03-01", name: "Semi-Perm Coupler", components: ["Coupler Body", "Drawbar", "Rubber Pad"] }] },
      { code: "GNG-04", name: "Draft Gear", equipments: [{ code: "GNG-04-01", name: "Draft Gear Assembly", components: ["Buffer", "Draft Key", "Yoke"] }] },
    ],
  },
  {
    code: "STR",
    name: "Structure & Interior",
    subsystems: [
      { code: "STR-01", name: "Carbody", equipments: [{ code: "STR-01-01", name: "Car Body Shell", components: ["Roof", "Side Wall", "End Wall", "Underframe"] }] },
      { code: "STR-02", name: "Saloon Interior", equipments: [{ code: "STR-02-01", name: "Interior Fitments", components: ["Handrail", "Seat", "Panel", "Window"] }] },
      { code: "STR-03", name: "Exterior Panels", equipments: [{ code: "STR-03-01", name: "Exterior Cladding", components: ["Side Panel", "Front Panel", "Wrap"] }] },
      { code: "STR-04", name: "Underframe", equipments: [{ code: "STR-04-01", name: "Underframe Assembly", components: ["Solebar", "Cross Bearer", "Equipment Rack"] }] },
      { code: "STR-05", name: "Driver Cab", equipments: [{ code: "STR-05-01", name: "Cab Interior", components: ["Desk", "Console", "Seat", "Screen"] }] },
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
  { id: "ADMIN", name: "SHASHI SHEKHAR MISHRA", password: "9799494321", role: "admin", initials: "SS" },
  { id: "BEML/70147", name: "AKHILESH KUMAR YADAV", password: "AKHILESH@1234", role: "engineer", initials: "AK" },
  { id: "BEML/70153", name: "CHANDAN KUMAR", password: "CHANDAN@1234", role: "engineer", initials: "CK" },
  { id: "BEML/DATA ENTRY OPERATOR", name: "KAUSHIK MONDAL", password: "KAUSHIK@1234", role: "data-entry", initials: "KM" },
  { id: "BEML/OFFICER/001", name: "ARAGHYA KAR", password: "ARAGHYA@1234", role: "officer", initials: "AK" },
  { id: "BEML/OFFICER/002", name: "SHILPA SAHU", password: "SHILPA@1234", role: "officer", initials: "SS" },
  { id: "BEML/OFFICER/003", name: "SHIRSHENDU MAJUMDAR", password: "SHIRSHENDU@1234", role: "officer", initials: "SM" },
  { id: "BEML/OFFICER/004", name: "SUNIL KUMAR RAJAN", password: "SUNIL@1234", role: "officer", initials: "SR" },
];

export const APPROVED_VENDORS = [
  { sl: 1, item: "Communication System", vendor: "M/s Televic Rail, Belgium", contact: "Mrs. Anneleen van Nieuwenhuyse", email: "A.Vannieuwenhuyse@televic.com", phone: "0032 472517640" },
  { sl: 2, item: "Battery", vendor: "M/s AMCO Saft India Pvt Ltd, Bangalore", contact: "Mr Sudheendra", email: "sudheendra.h@amcosaft.com", phone: "080-27307165" },
  { sl: 3, item: "Cables", vendor: "M/s Huber Suhner AG, Switzerland", contact: "Mr. Kashif Iqbal", email: "kashif.iqbal@hubersuhner.com", phone: "0124 452 6100" },
  { sl: 4, item: "Gear Box with Axle", vendor: "M/s Voith, Germany", contact: "Mr Pushpavanam Sundararaman", email: "Pushpavanam.sundararaman@Voith.com", phone: "040-27173561" },
  { sl: 5, item: "Trailing & Driving Wheelset", vendor: "M/s Bonatrans, India", contact: "Mr Vijay kalyani", email: "vijay.kalyani@ghh-bonatrans.com", phone: "9765293366" },
  { sl: 6, item: "Conical Rubber Spring", vendor: "M/s MTC, Bangalore", contact: "Mr K Raman", email: "Kraman@wabtec.com", phone: "9148153651" },
  { sl: 7, item: "Air Spring", vendor: "M/s Sumitomo Electric Industries, Japan", contact: "Mr Sandeep", email: "sandeep.kr.zj@hitachi-hightech.com", phone: "9650828456" },
  { sl: 8, item: "Brake System", vendor: "M/s Knorr Bremse India", contact: "Mr Sanjeeb", email: "Sanjib.Chakraborty@knorr-bremse.com", phone: "9711188530" },
  { sl: 9, item: "Couplers", vendor: "M/s Faiveley, India", contact: "Mr Jodhbir Singh", email: "jodhbir.singh@wabtec.com", phone: "9689083991" },
  { sl: 10, item: "Saloon Door System", vendor: "M/s Knorr Bremse", contact: "Mr Sanjeeb", email: "Sanjib.Chakraborty@knorr-bremse.com", phone: "9711188530" },
  { sl: 11, item: "Rubber Floor Covering", vendor: "M/s Gerflor France", contact: "M Pork Wimmer", email: "matthieu.devimeux@gerflor.com", phone: "07229 / 70800-218" },
  { sl: 12, item: "Third Rail Current Collection Device", vendor: "M/s Stemmann Technik, Germany", contact: "Mr Christian Ratzke / Mr Lalit Ahuja", email: "Cratzke@Wabtec.com", phone: "8950005505" },
  { sl: 13, item: "Gangway Assembly", vendor: "M/s Hubner, Germany", contact: "", email: "Jiao.Biermann@hubner-germany.com", phone: "49560301" },
  { sl: 14, item: "Ground Contact Assembly", vendor: "M/s Stemmann Technik, Germany", contact: "Mr Christian Ratzke / Mr Lalit Ahuja", email: "lahuja@Wabtec.com", phone: "8950005505" },
  { sl: 15, item: "Windshield Glass", vendor: "M/s Asahi India Glass Ltd, Gurgaon", contact: "Mr. Nitin Mohan Trivedi", email: "nitin.trivedi@aisglass.com", phone: "9873644193" },
  { sl: 16, item: "Floor Board", vendor: "M/s Milwaukee Composites Inc, USA", contact: "Mr. James Desiny", email: "jdesing@milwaukeecomposite.com", phone: "414-429-9651" },
  { sl: 17, item: "Saloon Interior Panel and Accessories", vendor: "M/s Hankurk Fibre Co. Ltd., Korea", contact: "Mr. Yujin Choi", email: "messi64@hfiber.com", phone: "+82 1062918389" },
  { sl: 18, item: "VAC System", vendor: "M/s Faiveley, India", contact: "Mr Keshav Ashok", email: "keshav.ashok@Wabtec.com", phone: "9626605777" },
  { sl: 19, item: "Interior Lights", vendor: "M/s Technoware, Finland", contact: "Mr Jeetendra Kumar", email: "Jeetendra.Kumar@teknoware.com", phone: "9711836387" },
  { sl: 20, item: "Exterior Lights", vendor: "M/s Mafelec, France", contact: "Mr Jean Bartholin", email: "Jean.BARTHOLINE@mafelec.fr", phone: "0033 632783016" },
  { sl: 21, item: "Lateral and Vertical Damper", vendor: "M/s ITT Holdings, Czech Republic", contact: "Mr. Nishikant", email: "panrly@panindiagroup.com", phone: "0124-2347711" },
  { sl: 22, item: "Floor Cushion Rubber", vendor: "M/s Getzner Werkstoffe GmbH, Austria", contact: "Mr. Sanjay Risbood", email: "sanjay.risbood@getzner.com", phone: "+98 22012233" },
  { sl: 23, item: "Window Glass and Draught Screen Glass", vendor: "M/s Impact Safety Glass, Bangalore", contact: "Mr. Noorulla", email: "noorulla@impactindia.com", phone: "973826127" },
  { sl: 24, item: "HV Equipment, Propulsion, APS & TMS", vendor: "M/s Melco Japan (Mitsubishi Electric)", contact: "Mr Aiyappa", email: "aiyappa.kg@asia.meap.com", phone: "9945128151" },
  { sl: 25, item: "Fire Survival Cables", vendor: "M/s Siechem Technologies Pvt Ltd, Chennai", contact: "Mr. Subramanaian", email: "sales@siechem.com", phone: "+91 44 25226141" },
  { sl: 26, item: "Saloon Seat", vendor: "M/s Presston Engineering Corporation, Bangalore", contact: "Supreeth .S", email: "businessdevelopment@presstonengg.com", phone: "+91 7899787639" },
  { sl: 27, item: "Fire Detection System", vendor: "M/s SEMA Systems / Ambro Asia", contact: "", email: "", phone: "" },
  { sl: 28, item: "Anti Roll Bar", vendor: "M/s Sarita Forgings", contact: "", email: "", phone: "" },
  { sl: 29, item: "EDB Panel", vendor: "M/s Amphenol / M/s River Engg", contact: "", email: "", phone: "" },
  { sl: 30, item: "Brake System End Fittings", vendor: "M/s Fluid Controls Pvt Ltd", contact: "", email: "", phone: "" },
  { sl: 31, item: "Cab Side Door & Partition Door", vendor: "M/s Valdel Industries Pvt Ltd, Bangalore", contact: "", email: "", phone: "" },
];

export const VENDOR_NAMES = APPROVED_VENDORS.map(v => ({ value: v.vendor, label: `${v.vendor} (${v.item})` }));

export const SYSTEMS: string[] = SYSTEM_TAXONOMY.map(s => s.name);

export const SUBSYSTEMS: Record<string, string[]> = Object.fromEntries(
  SYSTEM_TAXONOMY.map(s => [s.name, s.subsystems.map(ss => ss.name)])
);

export const EQUIPMENTS: Record<string, string[]> = Object.fromEntries(
  SYSTEM_TAXONOMY.flatMap(s => s.subsystems.map(ss => [ss.name, ss.equipments.map(e => e.name)]))
);

export const COMPONENTS: Record<string, string[]> = Object.fromEntries(
  SYSTEM_TAXONOMY.flatMap(s => s.subsystems.flatMap(ss => ss.equipments.map(e => [e.name, e.components])))
);
