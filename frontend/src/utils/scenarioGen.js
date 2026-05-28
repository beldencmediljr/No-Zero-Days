// Helper: convert baseHour + lateMins into a Base-60 formatted time string
function formatTimeIn(baseHour, lateMins) {
  const totalMins = (baseHour * 60) + lateMins;
  let h = Math.floor(totalMins / 60);
  let m = totalMins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12; // Convert to 12-hour format
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// Helper: distribute totalLateMinutes across 2-4 random non-holiday weekday slots
function distributeLateMinutes(totalLateMinutes, dayCount, holidayIndices) {
  const result = new Array(dayCount).fill(0);
  const eligible = [];
  for (let i = 0; i < dayCount; i++) {
    if (!holidayIndices.has(i)) eligible.push(i);
  }
  if (eligible.length === 0 || totalLateMinutes === 0) return result;

  const chunkCount = Math.min(eligible.length, 2 + Math.floor(Math.random() * 3));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const chosenDays = shuffled.slice(0, chunkCount);

  const chunks = [];
  let remaining = totalLateMinutes;
  for (let i = 0; i < chunkCount - 1; i++) {
    const maxSlice = remaining - (chunkCount - i - 1);
    const slice = Math.max(5, Math.round((Math.random() * maxSlice) / 5) * 5);
    const safeSlice = Math.min(slice, maxSlice);
    chunks.push(safeSlice);
    remaining -= safeSlice;
  }
  chunks.push(remaining);

  chosenDays.forEach((dayIdx, i) => {
    result[dayIdx] = chunks[i];
  });
  return result;
}

/**
 * Generates a randomized scenario payload specifically suited for Module 1, Phase 2.
 * Late minutes are distributed across Mon-Fri (skipping Friday holiday) with proper Base-60 time formatting.
 */
export function generatePhase2Scenario() {
  const employees = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Penduko', 'Anna Mangahas', 'Jose Rizal'];
  const companies = ['Apex Industrial Works', 'TechGear Solutions Inc.', 'Starlight Garments Corp.', 'Cebu Logistics Ltd.'];

  const rates = [500, 600, 750, 800, 900, 1000];
  const shifts = [7, 8, 9, 10, 11, 12, 13, 14, 15];

  const employeeName = employees[Math.floor(Math.random() * employees.length)];
  const companyName = companies[Math.floor(Math.random() * companies.length)];
  const dailyRate = rates[Math.floor(Math.random() * rates.length)];
  const daysPresent = shifts[Math.floor(Math.random() * shifts.length)];
  const hourlyRate = dailyRate / 8.0;

  // Total late minutes for the week
  const lateMinutesList = [15, 20, 30, 45, 60, 75, 90];
  const lateMinutes = lateMinutesList[Math.floor(Math.random() * lateMinutesList.length)];

  // FRI (June 12) is a Holiday — index 4 is off-limits for late minutes
  const HOLIDAY_INDEX = 4;
  const holidayIndices = new Set([HOLIDAY_INDEX]);
  const dayLabels = [
    'MON (June 8)',
    'TUE (June 9)',
    'WED (June 10)',
    'THU (June 11)',
    'FRI (June 12)',
  ];

  const latePerDay = distributeLateMinutes(lateMinutes, dayLabels.length, holidayIndices);

  // Red Herring trap: add a fake "grace period" of 15 mins to create a plausible but wrong total
  let redHerringLateMinutes = lateMinutes + 15;
  // Safety: if the trap accidentally equals the real total, offset further
  if (redHerringLateMinutes === lateMinutes) redHerringLateMinutes += 10;

  const biometricLogs = dayLabels.map((day, idx) => {
    if (holidayIndices.has(idx)) {
      return { day, timeIn: 'HOLIDAY', timeOut: 'HOLIDAY', late: 0, status: 'HOLIDAY' };
    }
    const dayLate = latePerDay[idx];
    return {
      day,
      timeIn: formatTimeIn(8, dayLate),
      timeOut: '05:00 PM',
      late: dayLate,
      status: dayLate > 0 ? 'LATE' : 'ON-TIME',
    };
  });

  // Dummy calendar grid for Lobby compatibility
  const calendarGrid = {};
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
    redHerringLateMinutes,
    earlyClockInMinutes: 0,
    calendarGrid,
    biometricLogs,
  };
}

/**
 * Generates a randomized scenario payload specifically suited for Module 2, Phase 1 (Overtime Premiums).
 * Includes raw OT hours and unpaid lunch breaks for Red Herring validation.
 */
export function generatePhase3Scenario() {
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
  const calendarGrid = {};
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

/**
 * Generates a randomized scenario payload specifically suited for Module 2, Phase 2 (Regular Holiday Pay).
 * Dictates that the employee worked on the Regular Holiday (June 12).
 */
export function generatePhase4Scenario() {
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
  const biometricLogs = [
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
  const calendarGrid = {};
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
    biometricLogs,
    workedOnHoliday: true // Phase 4 always has employee working on the holiday
  };
}

/**
 * Generates a randomized scenario payload specifically suited for Module 3, Phase 5 (SSS Deductions).
 */
export function generatePhase5Scenario() {
  const employees = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Penduko', 'Anna Mangahas', 'Jose Rizal'];
  const companies = ['Apex Industrial Works', 'TechGear Solutions Inc.', 'Starlight Garments Corp.', 'Cebu Logistics Ltd.'];
  const rates = [500, 600, 750, 800, 900, 1000];
  const shifts = [7, 8, 9, 10, 11, 12, 13, 14, 15];

  const employeeName = employees[Math.floor(Math.random() * employees.length)];
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
    earlyClockInMinutes: 0,
    calendarGrid: {},
    biometricLogs: [],
    sssEeShare,
    sssErShare,
    personalSalaryLoan,
    spouseLoan,
    basicSalary: dailyRate * daysPresent
  };
}

/**
 * Generates a randomized scenario payload specifically suited for Module 3, Phase 6 (PhilHealth Premiums).
 */
export function generatePhase6Scenario() {
  return generatePhase5Scenario();
}

/**
 * Generates a randomized scenario payload specifically suited for Module 4, Phase 7 (The Tribunal Final Boss).
 */
export function generatePhase7Scenario() {
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
    earlyClockInMinutes: 0,
    calendarGrid: {},
    biometricLogs: [],
    otHours,
    unpaidLunchHours,
    workedOnHoliday,
    sssEeShare,
    sssErShare,
    personalSalaryLoan,
    spouseLoan,
    basicSalary
  };
}
