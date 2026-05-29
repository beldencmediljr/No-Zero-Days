export interface BiometricLog {
  day: string;
  timeIn: string;
  timeOut: string;
  late: number;
  early?: number;
  status: 'LATE' | 'ON-TIME' | 'HOLIDAY';
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
  calendarGrid: Record<number, 'P' | 'A'>;
  biometricLogs: BiometricLog[];
  otHours?: number;
  unpaidLunchHours?: number;
  workedOnHoliday?: boolean;
  sssEeShare?: number;
  sssErShare?: number;
  personalSalaryLoan?: number;
  spouseLoan?: number;
  basicSalary?: number;
}

/**
 * Converts a total-minutes-from-midnight value into a formatted "HH:MM AM/PM" string.
 * Example: 555 minutes → "09:15 AM", 780 minutes → "01:00 PM"
 */
function minutesToTimeString(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const period = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const hh = hours12.toString().padStart(2, '0');
  const mm = mins.toString().padStart(2, '0');
  return `${hh}:${mm} ${period}`;
}

/**
 * Distributes `totalLateMinutes` randomly across 2–4 of the available non-holiday weekdays.
 * Returns an array of minute values (one per day, same length as `dayCount`).
 * Days designated as holidays receive 0 late minutes.
 */
function distributeLateMinutes(
  totalLateMinutes: number,
  dayCount: number,
  holidayIndices: Set<number>
): number[] {
  const result: number[] = new Array(dayCount).fill(0);
  // Collect eligible (non-holiday) day indices
  const eligible: number[] = [];
  for (let i = 0; i < dayCount; i++) {
    if (!holidayIndices.has(i)) eligible.push(i);
  }
  if (eligible.length === 0 || totalLateMinutes === 0) return result;

  // Choose 2–4 random days (but no more than available eligible days)
  const chunkCount = Math.min(
    eligible.length,
    2 + Math.floor(Math.random() * 3) // random int in [2, 4]
  );
  // Shuffle eligible and pick first chunkCount
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const chosenDays = shuffled.slice(0, chunkCount);

  // Distribute totalLateMinutes into chunkCount slices
  // Ensure each slice is at least 1 minute and a multiple of 5 for realism
  const chunks: number[] = [];
  let remaining = totalLateMinutes;
  for (let i = 0; i < chunkCount - 1; i++) {
    // Random share between 1 and remaining − (chunkCount − i − 1)
    const maxSlice = remaining - (chunkCount - i - 1);
    const slice = Math.max(5, Math.round((Math.random() * maxSlice) / 5) * 5);
    const safeSlice = Math.min(slice, maxSlice);
    chunks.push(safeSlice);
    remaining -= safeSlice;
  }
  chunks.push(remaining); // last chunk gets the rest

  // Assign chunks to chosen days
  chosenDays.forEach((dayIdx, i) => {
    result[dayIdx] = chunks[i];
  });
  return result;
}

/**
 * Generates a randomized scenario payload specifically suited for Module 1, Phase 2.
 * Includes standard Daily/Hourly rates and dynamic biometric logs containing Red Herring values.
 * Late minutes are distributed across Mon–Fri (skipping holidays) with proper time formatting.
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
  
  // Generate randomized total tardiness (in minutes)
  const lateMinutesList = [15, 20, 30, 45, 60, 75, 90];
  const lateMinutes = lateMinutesList[Math.floor(Math.random() * lateMinutesList.length)];

  // Define the 5-day work week structure for June 2026 Week 2
  // FRI (June 12) is a Regular Holiday — index 4
  const STANDARD_START_MINS = 8 * 60; // 08:00 AM = 480 minutes from midnight
  const HOLIDAY_INDEX = 4; // Friday = index 4
  const holidayIndices = new Set<number>([HOLIDAY_INDEX]);

  const dayLabels = [
    'MON (June 8)',
    'TUE (June 9)',
    'WED (June 10)',
    'THU (June 11)',
    'FRI (June 12)',
  ];

  // Distribute late minutes across non-holiday days
  const latePerDay = distributeLateMinutes(lateMinutes, dayLabels.length, holidayIndices);

  // Build biometric log entries
  const biometricLogs: BiometricLog[] = dayLabels.map((day, idx) => {
    if (holidayIndices.has(idx)) {
      return {
        day,
        timeIn: 'HOLIDAY',
        timeOut: 'HOLIDAY',
        late: 0,
        status: 'HOLIDAY',
      };
    }
    const dayLate = latePerDay[idx];
    const timeInMins = STANDARD_START_MINS + dayLate;
    return {
      day,
      timeIn: minutesToTimeString(timeInMins),
      timeOut: '05:00 PM',
      late: dayLate,
      status: dayLate > 0 ? 'LATE' : 'ON-TIME',
    };
  });

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
    calendarGrid,
    biometricLogs,
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
    calendarGrid,
    biometricLogs: [],
    otHours,
    unpaidLunchHours,
  };
}

/**
 * Generates a randomized scenario payload specifically suited for Module 2, Phase 2 (Regular Holiday Pay).
 * Dictates that the employee worked on the Regular Holiday (June 12).
 */
export function generatePhase4Scenario(): ScenarioData {
  const employees = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Penduko', 'Anna Mangahas', 'Jose Rizal'];
  const companies = ['Apex Industrial Works', 'TechGear Solutions Inc.', 'Starlight Garments Corp.', 'Cebu Logistics Ltd.'];
  const rates = [500, 600, 750, 800, 900, 1000];
  const shifts = [7, 8, 9, 10, 11, 12, 13, 14, 15];

  const employeeName = employees[Math.floor(Math.random() * employees.length)];
  const companyName = companies[Math.floor(Math.random() * companies.length)];
  const dailyRate = rates[Math.floor(Math.random() * rates.length)];
  const daysPresent = shifts[Math.floor(Math.random() * shifts.length)];
  const hourlyRate = dailyRate / 8.0;

  // Biometric logs show employee worked on regular holiday June 12
  const biometricLogs: BiometricLog[] = [
    {
      day: 'MON (June 8)',
      timeIn: '08:00 AM',
      timeOut: '05:00 PM',
      late: 0,
      early: 0,
      status: 'ON-TIME'
    },
    {
      day: 'TUE (June 9)',
      timeIn: '08:00 AM',
      timeOut: '05:00 PM',
      late: 0,
      early: 0,
      status: 'ON-TIME'
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
      timeIn: '08:00 AM',
      timeOut: '05:00 PM',
      late: 0,
      early: 0,
      status: 'HOLIDAY' // Worked on Holiday!
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
    lateMinutes: 0,
    calendarGrid,
    biometricLogs,
  };
}

/**
 * Generates a randomized scenario payload specifically suited for Module 3, Phase 5 (SSS Deductions).
 */
export function generatePhase5Scenario(): ScenarioData {
  const employees = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Penduko', 'Anna Mangahas', 'Jose Rizal'];
  const companies = ['Apex Industrial Works', 'TechGear Solutions Inc.', 'Starlight Garments Corp.', 'Cebu Logistics Ltd.'];
  const rates = [500, 600, 750, 800, 900, 1000];
  const shifts = [7, 8, 9, 10, 11, 12, 13, 14, 15];

  const employeeName = 'Juan Dela Cruz';
  const companyName = companies[Math.floor(Math.random() * companies.length)];
  const dailyRate = rates[Math.floor(Math.random() * rates.length)];
  const daysPresent = shifts[Math.floor(Math.random() * shifts.length)];
  const hourlyRate = dailyRate / 8.0;

  // SSS variables
  const sssEeList = [400, 450, 500, 550, 600, 650];
  const sssEeShare = sssEeList[Math.floor(Math.random() * sssEeList.length)];
  const sssErShare = sssEeShare * 2; // Decoy ER share is double EE share
  const personalSalaryLoanList = [200, 250, 300, 350, 400];
  const personalSalaryLoan = personalSalaryLoanList[Math.floor(Math.random() * personalSalaryLoanList.length)];
  const spouseLoan = 1500; // Decoy loan

  return {
    employeeName,
    companyName,
    dailyRate,
    daysPresent,
    riceSubsidy: 1200,
    uniformAllowance: 1500,
    hourlyRate,
    lateMinutes: 0,
    calendarGrid: {},
    biometricLogs: [],
    sssEeShare,
    sssErShare,
    personalSalaryLoan,
    spouseLoan,
    basicSalary: 22500.00,
  };
}

/**
 * Generates a randomized scenario payload specifically suited for Module 3, Phase 6 (PhilHealth Premiums).
 */
export function generatePhase6Scenario(): ScenarioData {
  return generatePhase5Scenario();
}

/**
 * Generates a randomized scenario payload specifically suited for Module 4, Phase 7 (The Tribunal Final Boss).
 */
export function generatePhase7Scenario(): ScenarioData {
  const employees = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Penduko', 'Anna Mangahas', 'Jose Rizal'];
  const companies = ['Apex Industrial Works', 'TechGear Solutions Inc.', 'Starlight Garments Corp.', 'Cebu Logistics Ltd.'];
  const rates = [500, 600, 750, 800, 900, 1000];
  const shifts = [10, 11, 12, 13, 14, 15]; // Contracted days present

  const employeeName = employees[Math.floor(Math.random() * employees.length)];
  const companyName = companies[Math.floor(Math.random() * companies.length)];
  const dailyRate = rates[Math.floor(Math.random() * rates.length)];
  const daysPresent = shifts[Math.floor(Math.random() * shifts.length)];
  const hourlyRate = dailyRate / 8.0;

  // Late Minutes
  const lateMinutesList = [15, 30, 45, 60];
  const lateMinutes = lateMinutesList[Math.floor(Math.random() * lateMinutesList.length)];

  // OT Hours and Unpaid Lunch
  const otHoursList = [3, 4, 5, 6];
  const otHours = otHoursList[Math.floor(Math.random() * otHoursList.length)];
  const unpaidLunchHours = 1.0;

  // Holiday worked (workedOnHoliday)
  const workedOnHoliday = Math.random() < 0.5;

  // SSS contribution
  const sssEeList = [400, 450, 500, 550, 600];
  const sssEeShare = sssEeList[Math.floor(Math.random() * sssEeList.length)];
  const sssErShare = sssEeShare * 2;
  const personalSalaryLoanList = [200, 250, 300, 350, 400];
  const personalSalaryLoan = personalSalaryLoanList[Math.floor(Math.random() * personalSalaryLoanList.length)];
  const spouseLoan = 1500;

  // Basic Salary
  const basicSalary = dailyRate * daysPresent;

  return {
    employeeName,
    companyName,
    dailyRate,
    daysPresent,
    riceSubsidy: 1200,
    uniformAllowance: 1500,
    hourlyRate,
    lateMinutes,
    calendarGrid: {},
    biometricLogs: [],
    otHours,
    unpaidLunchHours,
    workedOnHoliday,
    sssEeShare,
    sssErShare,
    personalSalaryLoan,
    spouseLoan,
    basicSalary,
  };
}

