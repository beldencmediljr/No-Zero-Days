export interface BiometricLog {
  day: string;
  timeIn: string;
  timeOut: string;
  late: number;
  early: number;
  status: 'LATE' | 'EARLY IN' | 'ON-TIME' | 'HOLIDAY';
}

export interface ScenarioData {
  employeeName: string;
  companyName: string;
  dailyRate: number;
  daysPresent: number;
  riceSubsidy: number;
  uniformAllowance: number;
  hourlyRate: number;
  lateMinutes: number;
  earlyClockInMinutes: number;
  calendarGrid: Record<number, 'P' | 'A'>;
  biometricLogs: BiometricLog[];
  otHours?: number;
  unpaidLunchHours?: number;
}

/**
 * Generates a randomized scenario payload specifically suited for Module 1, Phase 2.
 * Includes standard Daily/Hourly rates and dynamic biometric logs containing Red Herring values.
 */
export function generatePhase2Scenario(): ScenarioData {
  const employees = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Penduko', 'Anna Mangahas', 'Jose Rizal'];
  const companies = ['Apex Industrial Works', 'TechGear Solutions Inc.', 'Starlight Garments Corp.', 'Cebu Logistics Ltd.'];
  
  // Philippine Standard Rates & Days Worked
  const rates = [500, 600, 750, 800, 900, 1000];
  const shifts = [7, 8, 9, 10, 11, 12, 13, 14, 15];

  const employeeName = employees[Math.floor(Math.random() * employees.length)];
  const companyName = companies[Math.floor(Math.random() * companies.length)];
  const dailyRate = rates[Math.floor(Math.random() * rates.length)];
  const daysPresent = shifts[Math.floor(Math.random() * shifts.length)];

  // Derived variables
  const hourlyRate = dailyRate / 8.0;
  
  // Generate randomized tardiness components
  const lateMinutesList = [15, 20, 30, 45, 60, 75, 90];
  const lateMinutes = lateMinutesList[Math.floor(Math.random() * lateMinutesList.length)];
  
  const earlyInList = [5, 10, 15, 20, 25];
  const earlyClockInMinutes = earlyInList[Math.floor(Math.random() * earlyInList.length)];

  // Dynamic 5-day biometric logs list with status mapping
  const biometricLogs: BiometricLog[] = [
    {
      day: 'MON (June 8)',
      timeIn: `08:${lateMinutes < 10 ? '0' + lateMinutes : lateMinutes} AM`,
      timeOut: '05:00 PM',
      late: lateMinutes,
      early: 0,
      status: 'LATE'
    },
    {
      day: 'TUE (June 9)',
      timeIn: `07:${60 - earlyClockInMinutes} AM`,
      timeOut: '05:00 PM',
      late: 0,
      early: earlyClockInMinutes,
      status: 'EARLY IN'
    },
    {
      day: 'WED (June 10)',
      timeIn: '08:00 AM',
      timeOut: '05:00 PM',
      late: 0,
      early: 0,
      status: 'ON-TIME'
    },
    {
      day: 'THU (June 11)',
      timeIn: '08:00 AM',
      timeOut: '05:00 PM',
      late: 0,
      early: 0,
      status: 'ON-TIME'
    },
    {
      day: 'FRI (June 12)',
      timeIn: 'HOLIDAY',
      timeOut: 'HOLIDAY',
      late: 0,
      early: 0,
      status: 'HOLIDAY'
    }
  ];

  // Dummy calendar grid for Lobby compatibility
  const calendarGrid: Record<number, 'P' | 'A'> = {};
  const weekdaysList = [8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26];
  weekdaysList.forEach((day, index) => {
    calendarGrid[day] = index < daysPresent ? 'P' : 'A';
  });

  return {
    employeeName,
    companyName,
    dailyRate,
    daysPresent,
    riceSubsidy: 1200,
    uniformAllowance: 1500,
    hourlyRate,
    lateMinutes,
    earlyClockInMinutes,
    calendarGrid,
    biometricLogs
  };
}

/**
 * Generates a randomized scenario payload specifically suited for Module 2, Phase 1 (Overtime Premiums).
 * Includes raw OT hours and unpaid lunch breaks for Red Herring validation.
 */
export function generatePhase3Scenario(): ScenarioData {
  const employees = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Penduko', 'Anna Mangahas', 'Jose Rizal'];
  const companies = ['Apex Industrial Works', 'TechGear Solutions Inc.', 'Starlight Garments Corp.', 'Cebu Logistics Ltd.'];
  const rates = [500, 600, 750, 800, 900, 1000];
  const shifts = [7, 8, 9, 10, 11, 12, 13, 14, 15];

  const employeeName = employees[Math.floor(Math.random() * employees.length)];
  const companyName = companies[Math.floor(Math.random() * companies.length)];
  const dailyRate = rates[Math.floor(Math.random() * rates.length)];
  const daysPresent = shifts[Math.floor(Math.random() * shifts.length)];
  const hourlyRate = dailyRate / 8.0;

  // Overtime hours parameters
  const otHoursList = [3, 4, 5, 6, 7, 8];
  const otHours = otHoursList[Math.floor(Math.random() * otHoursList.length)];
  const unpaidLunchHours = 1.0; // 1 hour unpaid break

  // Dummy calendar grid for Lobby compatibility
  const calendarGrid: Record<number, 'P' | 'A'> = {};
  const weekdaysList = [8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26];
  weekdaysList.forEach((day, index) => {
    calendarGrid[day] = index < daysPresent ? 'P' : 'A';
  });

  return {
    employeeName,
    companyName,
    dailyRate,
    daysPresent,
    riceSubsidy: 1200,
    uniformAllowance: 1500,
    hourlyRate,
    lateMinutes: 0,
    earlyClockInMinutes: 0,
    calendarGrid,
    biometricLogs: [],
    otHours,
    unpaidLunchHours
  };
}
