import { PrismaClient } from '@prisma/client';
import { TicketQRService } from './services/qr.service';

const prisma = new PrismaClient();

export async function seedData() {
  console.log('🌱 Seeding SeatRelay database...');

  // 1. Create Users
  const rahul = await prisma.user.upsert({
    where: { email: 'rahul@example.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 98450 12345',
      role: 'seller'
    }
  });

  const priya = await prisma.user.upsert({
    where: { email: 'priya@example.com' },
    update: {},
    create: {
      name: 'Priya Kumar',
      email: 'priya@example.com',
      phone: '+91 98765 43210',
      role: 'buyer'
    }
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: 'ops@swiftbus.in' },
    update: {},
    create: {
      name: 'SwiftBus Operations',
      email: 'ops@swiftbus.in',
      phone: '+91 80 2345 6789',
      role: 'operator'
    }
  });

  // 2. Create Operator
  const swiftBus = await prisma.operator.upsert({
    where: { code: 'SWIFT' },
    update: {},
    create: {
      name: 'SwiftBus Express',
      code: 'SWIFT',
      contactEmail: 'support@swiftbus.in',
      supportsResale: true,
      supportsPassengerReissue: true,
      minimumResaleWindowMinutes: 60,
      maximumResalePrice: 'FACE_VALUE'
    }
  });

  // 3. Create Bus: Bangalore → Chennai, 19 Sep 2026, 10:30 PM
  const bus = await prisma.bus.create({
    data: {
      operatorId: swiftBus.id,
      busNumber: 'KA-01-F-8899',
      busType: 'AC Sleeper 2+1 (Multi-Axle)',
      routeFrom: 'Bangalore',
      routeTo: 'Chennai',
      departureTime: new Date('2026-09-19T22:30:00.000Z'),
      arrivalTime: new Date('2026-09-20T06:30:00.000Z'),
      travelDate: '2026-09-19',
      baseFare: 850.0
    }
  });

  // Create additional buses for realistic search options
  const bus2 = await prisma.bus.create({
    data: {
      operatorId: swiftBus.id,
      busNumber: 'KA-01-F-9911',
      busType: 'Volvo AC Semi-Sleeper (2+2)',
      routeFrom: 'Bangalore',
      routeTo: 'Chennai',
      departureTime: new Date('2026-09-19T21:00:00.000Z'),
      arrivalTime: new Date('2026-09-20T05:00:00.000Z'),
      travelDate: '2026-09-19',
      baseFare: 750.0
    }
  });

  const bus3 = await prisma.bus.create({
    data: {
      operatorId: swiftBus.id,
      busNumber: 'KA-01-F-3344',
      busType: 'Scania High-Deck AC Sleeper',
      routeFrom: 'Bangalore',
      routeTo: 'Chennai',
      departureTime: new Date('2026-09-19T23:15:00.000Z'),
      arrivalTime: new Date('2026-09-20T07:00:00.000Z'),
      travelDate: '2026-09-19',
      baseFare: 950.0
    }
  });

  // 4. Create Seats for Bus 1 (All booked so it is SOLD OUT, with U12 belonging to Rahul)
  const seatLabels = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
  let seatU12: any = null;

  for (const label of seatLabels) {
    const seat = await prisma.seat.create({
      data: {
        busId: bus.id,
        seatNumber: label,
        seatType: label.startsWith('U') ? 'UPPER_BERTH' : 'LOWER_BERTH',
        status: 'BOOKED'
      }
    });

    if (label === 'U12') {
      seatU12 = seat;
    } else {
      // Create other booked tickets to simulate sold out bus
      await prisma.ticket.create({
        data: {
          ticketNumber: `SB-${Math.floor(10000 + Math.random() * 80000)}`,
          userId: operatorUser.id,
          busId: bus.id,
          seatId: seat.id,
          passengerName: `Traveller ${label}`,
          passengerAge: 30,
          passengerGender: 'Male',
          fare: 850.0,
          status: 'CONFIRMED'
        }
      });
    }
  }

  // Seats for Bus 2 & Bus 3 (Have a few available direct seats)
  for (let i = 1; i <= 8; i++) {
    await prisma.seat.create({
      data: {
        busId: bus2.id,
        seatNumber: `S${i}`,
        seatType: 'SEATER',
        status: i <= 5 ? 'BOOKED' : 'AVAILABLE'
      }
    });
  }

  // 5. Create Rahul's Ticket for Seat U12
  const qrDataUrl = await TicketQRService.generateQRCode({
    ticketId: 'SB-92831',
    operator: 'SwiftBus Express',
    busNumber: bus.busNumber,
    route: 'Bangalore → Chennai',
    date: '2026-09-19',
    seat: 'U12',
    passengerName: 'Rahul Sharma',
    status: 'CONFIRMED'
  });

  const rahulTicket = await prisma.ticket.create({
    data: {
      ticketNumber: 'SB-92831',
      userId: rahul.id,
      busId: bus.id,
      seatId: seatU12.id,
      passengerName: 'Rahul Sharma',
      passengerAge: 28,
      passengerGender: 'Male',
      passengerPhone: rahul.phone,
      govIdType: 'Aadhaar Card',
      govIdNumber: '5412 8934 1122',
      fare: 850.0,
      status: 'CONFIRMED',
      qrCode: qrDataUrl
    }
  });

  // Create welcome notification for Rahul
  await prisma.notification.create({
    data: {
      userId: rahul.id,
      title: 'Booking Confirmed: Bangalore → Chennai',
      message: 'Your ticket SB-92831 for SwiftBus on 19 Sep 2026, 10:30 PM (Seat U12) is confirmed.',
      type: 'SUCCESS'
    }
  });

  console.log(`✅ Seed complete!`);
  console.log(`- Seller: Rahul Sharma (${rahul.id}) - Ticket SB-92831, Seat U12, ₹850`);
  console.log(`- Buyer: Priya Kumar (${priya.id})`);
  console.log(`- Bus: SwiftBus Bangalore → Chennai (19 Sep 2026, 10:30 PM) [SOLD OUT]`);
}

if (require.main === module) {
  seedData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
