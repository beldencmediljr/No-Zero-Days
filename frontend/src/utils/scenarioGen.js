/**
 * Generates a randomized scenario payload specifically suited for Module 1, Phase 2.
 * Includes standard Daily/Hourly rates and dynamic biometric logs containing Red Herring values.
 */
export function generatePhase2Scenario() {
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
  const biometricLogs = [
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
    earlyClockInMinutes,
    calendarGrid,
    biometricLogs
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
