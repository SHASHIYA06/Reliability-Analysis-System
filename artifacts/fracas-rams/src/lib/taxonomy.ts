export const SYSTEM_TAXONOMY = [
  {
    code: "1.0",
    name: "Propulsion",
    subsystems: [
      { code: "1.1", name: "Collector Shoes" },
      { code: "1.2", name: "HSCB & Earthing Switch" },
      { code: "1.3", name: "Traction Inverter" },
      { code: "1.4", name: "Traction Motor" },
      { code: "1.5", name: "VVVF" },
      { code: "1.6", name: "Others" },
    ],
  },
  {
    code: "2.0",
    name: "Auxiliary Supply System",
    subsystems: [
      { code: "2.1", name: "Auxiliary Converter" },
      { code: "2.2", name: "Battery Charger" },
      { code: "2.3", name: "Back-up Battery" },
    ],
  },
  {
    code: "3.0",
    name: "Air Supply & Friction Brake",
    subsystems: [
      { code: "3.1", name: "Air Supply Equipment" },
      { code: "3.2", name: "Friction Brake Equipment" },
    ],
  },
  {
    code: "4.0",
    name: "Door System & Controls",
    subsystems: [
      { code: "4.1", name: "Passenger Door" },
    ],
  },
  {
    code: "5.0",
    name: "VAC System & Controls",
    subsystems: [
      { code: "5.1", name: "Saloon VAC" },
    ],
  },
  {
    code: "6.0",
    name: "Communication System",
    subsystems: [
      { code: "6.1", name: "PA-PIS & CCTV" },
    ],
  },
  {
    code: "7.0",
    name: "Coupler & Draft Gear",
    subsystems: [
      { code: "7.1", name: "Automatic Coupler" },
      { code: "7.2", name: "Semi-Permanent Coupler" },
    ],
  },
  {
    code: "8.0",
    name: "Bogies",
    subsystems: [
      { code: "8.1", name: "Driver Gear and Coupler" },
      { code: "8.2", name: "Primary Suspension" },
      { code: "8.3", name: "Secondary Suspension" },
      { code: "8.4", name: "Wheelset" },
    ],
  },
  {
    code: "9.0",
    name: "Lighting System",
    subsystems: [
      { code: "9.1", name: "Head Light" },
      { code: "9.2", name: "Tail Light" },
    ],
  },
  {
    code: "10.0",
    name: "TCMS",
    subsystems: [
      { code: "10.1", name: "Control Unit" },
      { code: "10.2", name: "Local Unit" },
      { code: "10.3", name: "Car Interface Unit" },
      { code: "10.4", name: "Display Controller" },
      { code: "10.5", name: "Video Display Unit" },
    ],
  },
  {
    code: "11.0",
    name: "Structure & Vehicle Interior",
    subsystems: [
      { code: "11.1", name: "VCC" },
      { code: "11.2", name: "Carbody & Interior" },
      { code: "11.3", name: "Exterior other than underframe" },
      { code: "11.4", name: "Exterior Underframe" },
    ],
  },
  {
    code: "12.0",
    name: "Gangway",
    subsystems: [
      { code: "12.1", name: "Corrugated Bellows" },
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
  { code: "W16", description: "Failure of driver's desk displays (VDU)" }
];
