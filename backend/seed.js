import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Employee from './models/Employee.js';
import Department from './models/Department.js';
import { Asset } from './models/Asset.js';
import { AssetAssignment } from './models/Asset.js';
import Attendance from './models/Attendance.js';
import Leave from './models/Leave.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Asset.deleteMany({});
    await AssetAssignment.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    
    console.log('🗑️  Cleared existing data');

    // Create departments
    const departments = await Department.insertMany([
      {
        name: 'Human Resources',
        description: 'Handles recruitment, employee relations, and HR operations',
        contactEmail: 'hr@company.com',
        contactPhone: '+1-555-0101',
        budget: 500000,
        location: 'Floor 5, West Wing'
      },
      {
        name: 'Information Technology',
        description: 'Manages technology infrastructure and support',
        contactEmail: 'it@company.com', 
        contactPhone: '+1-555-0102',
        budget: 1200000,
        location: 'Floor 3, East Wing'
      },
      {
        name: 'Finance',
        description: 'Handles financial operations and accounting',
        contactEmail: 'finance@company.com',
        contactPhone: '+1-555-0103',
        budget: 800000,
        location: 'Floor 4, Central Wing'
      },
      {
        name: 'Marketing',
        description: 'Responsible for marketing and brand management',
        contactEmail: 'marketing@company.com',
        contactPhone: '+1-555-0104',
        budget: 750000,
        location: 'Floor 2, North Wing'
      },
      {
        name: 'Sales',
        description: 'Handles customer acquisition and revenue generation',
        contactEmail: 'sales@company.com',
        contactPhone: '+1-555-0105',
        budget: 900000,
        location: 'Floor 1, South Wing'
      },
      {
        name: 'Operations',
        description: 'Manages daily business operations and logistics',
        contactEmail: 'operations@company.com',
        contactPhone: '+1-555-0106',
        budget: 600000,
        location: 'Floor 2, West Wing'
      }
    ]);

    console.log('🏢 Created departments');

    // Create users and employees
    const usersData = [
      // Admin user
      {
        email: 'admin@company.com',
        password: 'admin123',
        role: 'admin',
        employeeData: {
          employeeId: 'EMP1001',
          firstName: 'Alex',
          lastName: 'Thompson',
          email: 'admin@company.com',
          phone: '+1-555-1001',
          dateOfBirth: new Date('1980-05-15'),
          address: {
            street: '123 Tech Park Drive',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94105'
          },
          jobTitle: 'System Administrator',
          department: departments[1]._id, // IT
          salary: 95000,
          employmentType: 'full_time',
          hireDate: new Date('2020-01-15'),
          skills: ['System Administration', 'Network Security', 'Cloud Computing'],
          emergencyContact: {
            name: 'Maria Thompson',
            relationship: 'Spouse',
            phone: '+1-555-1002'
          }
        }
      },
      // HR Manager
      {
        email: 'sarah.johnson@company.com',
        password: 'hr123',
        role: 'hr',
        employeeData: {
          employeeId: 'EMP1002',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@company.com',
          phone: '+1-555-1003',
          dateOfBirth: new Date('1985-08-22'),
          address: {
            street: '456 Business Avenue',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94107'
          },
          jobTitle: 'HR Manager',
          department: departments[0]._id, // HR
          salary: 85000,
          employmentType: 'full_time',
          hireDate: new Date('2019-03-10'),
          skills: ['Recruitment', 'Employee Relations', 'HR Policies'],
          emergencyContact: {
            name: 'Michael Johnson',
            relationship: 'Spouse',
            phone: '+1-555-1004'
          }
        }
      },
      // IT Manager
      {
        email: 'mike.chen@company.com',
        password: 'it123',
        role: 'manager',
        employeeData: {
          employeeId: 'EMP1003',
          firstName: 'Mike',
          lastName: 'Chen',
          email: 'mike.chen@company.com',
          phone: '+1-555-1005',
          dateOfBirth: new Date('1982-11-30'),
          address: {
            street: '789 Innovation Road',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94102'
          },
          jobTitle: 'IT Manager',
          department: departments[1]._id, // IT
          salary: 110000,
          employmentType: 'full_time',
          hireDate: new Date('2018-06-20'),
          skills: ['Project Management', 'Software Architecture', 'Team Leadership'],
          emergencyContact: {
            name: 'Lisa Chen',
            relationship: 'Spouse',
            phone: '+1-555-1006'
          }
        }
      },
      // Finance Manager
      {
        email: 'david.wilson@company.com',
        password: 'finance123',
        role: 'manager',
        employeeData: {
          employeeId: 'EMP1004',
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david.wilson@company.com',
          phone: '+1-555-1007',
          dateOfBirth: new Date('1978-03-14'),
          address: {
            street: '321 Finance Street',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94108'
          },
          jobTitle: 'Finance Manager',
          department: departments[2]._id, // Finance
          salary: 105000,
          employmentType: 'full_time',
          hireDate: new Date('2017-09-05'),
          skills: ['Financial Analysis', 'Budgeting', 'Risk Management'],
          emergencyContact: {
            name: 'Jennifer Wilson',
            relationship: 'Spouse',
            phone: '+1-555-1008'
          }
        }
      },
      // Regular Employees
      {
        email: 'emily.davis@company.com',
        password: 'employee123',
        role: 'employee',
        employeeData: {
          employeeId: 'EMP1005',
          firstName: 'Emily',
          lastName: 'Davis',
          email: 'emily.davis@company.com',
          phone: '+1-555-1009',
          dateOfBirth: new Date('1990-07-08'),
          address: {
            street: '654 Creative Lane',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94110'
          },
          jobTitle: 'HR Specialist',
          department: departments[0]._id, // HR
          manager: null, // Will set after creating employees
          salary: 65000,
          employmentType: 'full_time',
          hireDate: new Date('2021-02-15'),
          skills: ['Recruitment', 'Onboarding', 'Benefits Administration'],
          emergencyContact: {
            name: 'Robert Davis',
            relationship: 'Spouse',
            phone: '+1-555-1010'
          }
        }
      },
      {
        email: 'john.smith@company.com',
        password: 'employee123',
        role: 'employee',
        employeeData: {
          employeeId: 'EMP1006',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@company.com',
          phone: '+1-555-1011',
          dateOfBirth: new Date('1992-12-03'),
          address: {
            street: '987 Developer Road',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94103'
          },
          jobTitle: 'Software Developer',
          department: departments[1]._id, // IT
          manager: null,
          salary: 85000,
          employmentType: 'full_time',
          hireDate: new Date('2022-01-10'),
          skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
          emergencyContact: {
            name: 'Sarah Smith',
            relationship: 'Spouse',
            phone: '+1-555-1012'
          }
        }
      },
      {
        email: 'lisa.wang@company.com',
        password: 'employee123',
        role: 'employee',
        employeeData: {
          employeeId: 'EMP1007',
          firstName: 'Lisa',
          lastName: 'Wang',
          email: 'lisa.wang@company.com',
          phone: '+1-555-1013',
          dateOfBirth: new Date('1991-04-18'),
          address: {
            street: '246 Analyst Avenue',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94104'
          },
          jobTitle: 'Financial Analyst',
          department: departments[2]._id, // Finance
          manager: null,
          salary: 70000,
          employmentType: 'full_time',
          hireDate: new Date('2021-08-22'),
          skills: ['Financial Modeling', 'Excel', 'Data Analysis'],
          emergencyContact: {
            name: 'James Wang',
            relationship: 'Spouse',
            phone: '+1-555-1014'
          }
        }
      },
      {
        email: 'robert.brown@company.com',
        password: 'employee123',
        role: 'employee',
        employeeData: {
          employeeId: 'EMP1008',
          firstName: 'Robert',
          lastName: 'Brown',
          email: 'robert.brown@company.com',
          phone: '+1-555-1015',
          dateOfBirth: new Date('1989-09-25'),
          address: {
            street: '135 Marketing Drive',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94109'
          },
          jobTitle: 'Marketing Specialist',
          department: departments[3]._id, // Marketing
          manager: null,
          salary: 68000,
          employmentType: 'full_time',
          hireDate: new Date('2022-03-30'),
          skills: ['Digital Marketing', 'SEO', 'Content Creation'],
          emergencyContact: {
            name: 'Amanda Brown',
            relationship: 'Spouse',
            phone: '+1-555-1016'
          }
        }
      },
      {
        email: 'maria.garcia@company.com',
        password: 'employee123',
        role: 'employee',
        employeeData: {
          employeeId: 'EMP1009',
          firstName: 'Maria',
          lastName: 'Garcia',
          email: 'maria.garcia@company.com',
          phone: '+1-555-1017',
          dateOfBirth: new Date('1993-06-12'),
          address: {
            street: '579 Sales Street',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94111'
          },
          jobTitle: 'Sales Representative',
          department: departments[4]._id, // Sales
          manager: null,
          salary: 60000,
          employmentType: 'full_time',
          hireDate: new Date('2023-01-08'),
          skills: ['Sales', 'Customer Relations', 'Negotiation'],
          emergencyContact: {
            name: 'Carlos Garcia',
            relationship: 'Spouse',
            phone: '+1-555-1018'
          }
        }
      },
      {
        email: 'kevin.martin@company.com',
        password: 'employee123',
        role: 'it',
        employeeData: {
          employeeId: 'EMP1010',
          firstName: 'Kevin',
          lastName: 'Martin',
          email: 'kevin.martin@company.com',
          phone: '+1-555-1019',
          dateOfBirth: new Date('1987-02-28'),
          address: {
            street: '864 Support Road',
            city: 'San Francisco',
            state: 'CA',
            country: 'USA',
            zipCode: '94112'
          },
          jobTitle: 'IT Support Specialist',
          department: departments[1]._id, // IT
          manager: null,
          salary: 60000,
          employmentType: 'full_time',
          hireDate: new Date('2021-11-15'),
          skills: ['Technical Support', 'Hardware', 'Network Troubleshooting'],
          emergencyContact: {
            name: 'Jessica Martin',
            relationship: 'Spouse',
            phone: '+1-555-1020'
          }
        }
      }
    ];

    // Create users and employees
    const createdUsers = [];
    const createdEmployees = [];

    for (const userData of usersData) {
      // Create user
      const user = new User({
        email: userData.email,
        password: userData.password,
        role: userData.role
      });
      await user.save();

      // Create employee
      const employee = new Employee(userData.employeeData);
      employee.user = user._id;
      await employee.save();

      // Update user with employee reference
      user.employee = employee._id;
      await user.save();

      createdUsers.push(user);
      createdEmployees.push(employee);
    }

    console.log('👥 Created users and employees');

    // Set manager relationships
    const hrManager = createdEmployees.find(e => e.jobTitle === 'HR Manager');
    const itManager = createdEmployees.find(e => e.jobTitle === 'IT Manager');
    const financeManager = createdEmployees.find(e => e.jobTitle === 'Finance Manager');

    await Employee.updateMany(
      { department: departments[0]._id, _id: { $ne: hrManager._id } },
      { manager: hrManager._id }
    );

    await Employee.updateMany(
      { department: departments[1]._id, _id: { $ne: itManager._id } },
      { manager: itManager._id }
    );

    await Employee.updateMany(
      { department: departments[2]._id, _id: { $ne: financeManager._id } },
      { manager: financeManager._id }
    );

    console.log('👨‍💼 Set manager relationships');

    // Create assets
    const assets = await Asset.insertMany([
      {
        name: 'MacBook Pro 16"',
        category: 'laptop',
        serialNumber: 'MPB2023001',
        model: 'MacBook Pro 16-inch',
        brand: 'Apple',
        purchaseDate: new Date('2023-01-15'),
        warrantyExpiry: new Date('2025-01-15'),
        cost: 2499,
        status: 'assigned',
        condition: 'excellent',
        location: 'IT Department',
        specifications: {
          processor: 'M2 Pro',
          memory: '32GB',
          storage: '1TB SSD',
          display: '16-inch Liquid Retina XDR'
        },
        purchaseInfo: {
          vendor: 'Apple Store',
          invoiceNumber: 'INV-2023-001'
        }
      },
      {
        name: 'Dell XPS 15',
        category: 'laptop',
        serialNumber: 'DXP2023002',
        model: 'XPS 15 9520',
        brand: 'Dell',
        purchaseDate: new Date('2023-02-20'),
        warrantyExpiry: new Date('2025-02-20'),
        cost: 1899,
        status: 'assigned',
        condition: 'good',
        location: 'IT Department',
        specifications: {
          processor: 'Intel i7-12700H',
          memory: '16GB',
          storage: '512GB SSD',
          display: '15.6-inch 4K UHD+'
        }
      },
      {
        name: 'iPhone 14 Pro',
        category: 'phone',
        serialNumber: 'IPH2023001',
        model: 'iPhone 14 Pro',
        brand: 'Apple',
        purchaseDate: new Date('2023-03-10'),
        warrantyExpiry: new Date('2024-03-10'),
        cost: 999,
        status: 'assigned',
        condition: 'excellent',
        location: 'IT Department'
      },
      {
        name: 'Samsung Galaxy S23',
        category: 'phone',
        serialNumber: 'SAM2023001',
        model: 'Galaxy S23',
        brand: 'Samsung',
        purchaseDate: new Date('2023-04-05'),
        warrantyExpiry: new Date('2024-04-05'),
        cost: 799,
        status: 'available',
        condition: 'excellent',
        location: 'IT Storage'
      },
      {
        name: 'Dell UltraSharp 27" Monitor',
        category: 'monitor',
        serialNumber: 'DEL2023001',
        model: 'U2723QE',
        brand: 'Dell',
        purchaseDate: new Date('2023-01-25'),
        warrantyExpiry: new Date('2026-01-25'),
        cost: 699,
        status: 'available',
        condition: 'good',
        location: 'IT Storage'
      },
      {
        name: 'Ergonomic Office Chair',
        category: 'furniture',
        serialNumber: 'CHA2023001',
        brand: 'Herman Miller',
        purchaseDate: new Date('2023-05-15'),
        cost: 1299,
        status: 'assigned',
        condition: 'excellent',
        location: 'HR Department'
      }
    ]);

    console.log('💻 Created assets');

    // Create asset assignments
    const johnSmith = createdEmployees.find(e => e.firstName === 'John');
    const emilyDavis = createdEmployees.find(e => e.firstName === 'Emily');
    const adminUser = createdEmployees.find(e => e.firstName === 'Alex');

    await AssetAssignment.insertMany([
      {
        asset: assets[0]._id, // MacBook Pro
        employee: johnSmith._id,
        assignedDate: new Date('2023-02-01'),
        expectedReturnDate: new Date('2025-02-01'),
        assignmentStatus: 'active',
        notes: 'Assigned for development work',
        assignedBy: adminUser._id
      },
      {
        asset: assets[1]._id, // Dell XPS
        employee: emilyDavis._id,
        assignedDate: new Date('2023-03-01'),
        expectedReturnDate: new Date('2025-03-01'),
        assignmentStatus: 'active',
        notes: 'HR department use',
        assignedBy: adminUser._id
      },
      {
        asset: assets[2]._id, // iPhone 14 Pro
        employee: johnSmith._id,
        assignedDate: new Date('2023-04-01'),
        assignmentStatus: 'active',
        notes: 'Business communication',
        assignedBy: adminUser._id
      },
      {
        asset: assets[5]._id, // Office Chair
        employee: emilyDavis._id,
        assignedDate: new Date('2023-06-01'),
        assignmentStatus: 'active',
        notes: 'Ergonomic workstation setup',
        assignedBy: adminUser._id
      }
    ]);

    console.log('📦 Created asset assignments');

    // Create attendance records (last 30 days)
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const employee of createdEmployees) {
        // Randomize attendance patterns
        const status = Math.random() > 0.1 ? 'present' : 'absent';
        const clockIn = status === 'present' ? 
          `0${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : 
          null;
        const clockOut = status === 'present' ? 
          `1${6 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : 
          null;

        attendanceRecords.push({
          employee: employee._id,
          date: new Date(date),
          clockIn,
          clockOut,
          status,
          location: Math.random() > 0.8 ? 'remote' : 'office',
          lateMinutes: clockIn && parseInt(clockIn.split(':')[0]) > 9 ? 
            (parseInt(clockIn.split(':')[0]) - 9) * 60 + parseInt(clockIn.split(':')[1]) : 0
        });
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log('⏰ Created attendance records');

    // Create leave requests
    const leaveRequests = await Leave.insertMany([
      {
        employee: johnSmith._id,
        leaveType: 'vacation',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-22'),
        reason: 'Family vacation',
        status: 'approved',
        approvedBy: itManager._id,
        comments: 'Enjoy your vacation!'
      },
      {
        employee: emilyDavis._id,
        leaveType: 'sick',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-03'),
        reason: 'Flu recovery',
        status: 'approved',
        approvedBy: hrManager._id
      },
      {
        employee: createdEmployees.find(e => e.firstName === 'Lisa')._id,
        leaveType: 'wfh',
        startDate: new Date('2024-02-10'),
        endDate: new Date('2024-02-10'),
        reason: 'Home maintenance appointment',
        status: 'pending'
      }
    ]);

    console.log('🏖️ Created leave requests');

    // Summary
    console.log('\n🎉 Seeding completed successfully!');
    console.log('=================================');
    console.log(`🏢 Departments: ${departments.length}`);
    console.log(`👥 Employees: ${createdEmployees.length}`);
    console.log(`👤 Users: ${createdUsers.length}`);
    console.log(`💻 Assets: ${assets.length}`);
    console.log(`⏰ Attendance Records: ${attendanceRecords.length}`);
    console.log(`🏖️ Leave Requests: ${leaveRequests.length}`);
    
    console.log('\n🔑 Default Login Credentials:');
    console.log('Admin: admin@company.com / admin123');
    console.log('HR Manager: sarah.johnson@company.com / hr123');
    console.log('IT Manager: mike.chen@company.com / it123');
    console.log('Regular Employee: john.smith@company.com / employee123');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding
seedData();