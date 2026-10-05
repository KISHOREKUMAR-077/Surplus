import http from 'http';

const BASE_URL = 'http://localhost:5000';

async function request(path: string, options: { method?: string; body?: any; headers?: any } = {}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          let parsed = resData;
          try {
            parsed = JSON.parse(resData);
          } catch {}
          resolve({ status: res.statusCode || 500, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runVerification() {
  console.log('🧪 Starting SLAstice Comprehensive Feature Verification...\n');
  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name} ${detail ? `- ${detail}` : ''}`);
    }
  }

  // 1. Health Check
  const health = await request('/api/health');
  assert('1. Health Check endpoint (/api/health)', health.status === 200 && health.data.status === 'ok');

  // 2. Bootstrap
  const boot = await request('/api/bootstrap');
  assert('2. Bootstrap state (/api/bootstrap)', boot.status === 200 && Array.isArray(boot.data.donations));

  // 3. User Identity & Switching
  const users = await request('/api/users');
  assert('3.1 List users (/api/users)', users.status === 200 && users.data.length > 0);

  const currentUser = await request('/api/users/current');
  assert('3.2 Current active user profile (/api/users/current)', currentUser.status === 200 && !!currentUser.data.name);

  const switchUser = await request('/api/users/switch', {
    method: 'POST',
    body: { userId: 'donor_1' },
  });
  assert('3.3 Switch user context (/api/users/switch)', switchUser.status === 200 && switchUser.data.success);

  // 4. AI Screening Engine
  const sampleImage = 'data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const screening = await request('/api/analyze-food', {
    method: 'POST',
    body: {
      imageBase64: sampleImage,
      foodName: 'Fresh Saffron Pulao Rice',
      stage: 'donor',
      inspectorName: 'Chef Test',
    },
  });
  assert(
    '4. AI Computer Vision Screening (/api/analyze-food)',
    screening.status === 200 && !!screening.data.condition && !!screening.data.screeningId,
    `Condition: ${screening.data?.condition}, Confidence: ${screening.data?.confidence}`
  );

  // 5. Food Donation Lifecycle: Stage 1 Creation
  const newDonationRes = await request('/api/donations', {
    method: 'POST',
    body: {
      title: 'Automated Test Surplus Feast',
      category: 'Cooked Meals',
      quantity: 40,
      unit: 'kg',
      dietaryType: 'Veg',
      preparedAt: 'Today 12:00 PM',
      expiryAt: 'Today 08:00 PM',
      storageCondition: 'Hot Insulated (>60°C)',
      description: 'Automated test surplus food preparation batch',
      allergens: 'None',
      donorId: 'donor_1',
      donorName: 'Chef Rajesh Sharma',
      donorOrg: 'Royal Orchid Banquet & Caterers',
      donorPhone: '+91 98112 34567',
      donorLocation: {
        address: 'Sector 18, Commercial Hub, New Delhi',
        lat: 28.5355,
        lng: 77.391,
      },
      foodImage: sampleImage,
      donorScreening: screening.data,
    },
  });
  const createdDonation = newDonationRes.data;
  assert(
    '5.1 Create new food donation batch (/api/donations)',
    newDonationRes.status === 201 && createdDonation.id?.startsWith('SLA-DON-'),
    `Created ID: ${createdDonation?.id}`
  );

  const getDonation = await request(`/api/donations/${createdDonation.id}`);
  assert('5.2 Get donation by ID (/api/donations/:id)', getDonation.status === 200 && getDonation.data.id === createdDonation.id);

  const traceLog = await request(`/api/donations/${createdDonation.id}/traceability`);
  assert(
    '5.3 Chain-of-custody traceability log (/api/donations/:id/traceability)',
    traceLog.status === 200 && Array.isArray(traceLog.data.traceabilityLog) && traceLog.data.traceabilityLog.length >= 1
  );

  // 6. Multi-Factor Smart Matching Engine
  const matching = await request('/api/matching/recommendations?ngoId=ngo_1&maxDistance=30');
  assert(
    '6. Multi-Factor Smart Matching Recommendations (/api/matching/recommendations)',
    matching.status === 200 && Array.isArray(matching.data) && matching.data.length > 0 && typeof matching.data[0].score === 'number',
    `Top match score: ${matching.data?.[0]?.score}%, Distance: ${matching.data?.[0]?.distanceKm} km`
  );

  // 7. Stage 2 Claim Request & Donor Approval
  const claimRes = await request(`/api/donations/${createdDonation.id}/request`, {
    method: 'POST',
    body: {
      ngoId: 'ngo_1',
      ngoName: 'Asha Community Food Bank & Shelter',
      beneficiariesTarget: 60,
      notes: 'Test claim for shelter distribution',
      ngoLocation: {
        address: 'Mayur Vihar Phase 1, New Delhi',
        lat: 28.6085,
        lng: 77.2965,
      },
    },
  });
  assert('7.1 NGO claim request (/api/donations/:id/request)', claimRes.status === 200 && claimRes.data.status === 'REQUESTED');

  const approveRes = await request(`/api/donations/${createdDonation.id}/approve`, {
    method: 'POST',
  });
  assert('7.2 Donor approves claim request (/api/donations/:id/approve)', approveRes.status === 200 && approveRes.data.status === 'APPROVED');

  // 8. Delivery Partner Dispatch & Stage 2 Pickup Verification
  const availDeliveries = await request('/api/deliveries/available');
  assert(
    '8.1 Query available delivery runs (/api/deliveries/available)',
    availDeliveries.status === 200 && availDeliveries.data.some((d: any) => d.id === createdDonation.id)
  );

  const acceptDelivery = await request(`/api/donations/${createdDonation.id}/accept-delivery`, {
    method: 'POST',
    body: {
      partnerId: 'delivery_1',
      partnerName: 'Amit Verma',
      partnerPhone: '+91 99102 88471',
      vehicleType: 'E-Bike',
    },
  });
  assert('8.2 Delivery partner accepts task (/api/donations/:id/accept-delivery)', acceptDelivery.status === 200 && acceptDelivery.data.status === 'DELIVERY_PARTNER_ASSIGNED');

  const pickupVerify = await request(`/api/donations/${createdDonation.id}/verify-pickup`, {
    method: 'POST',
    body: {
      screening: {
        ...screening.data,
        stage: 'pickup',
        inspectorName: 'Amit Verma (Delivery)',
      },
    },
  });
  assert('8.3 Stage 2 Camera Pickup Verification (/api/donations/:id/verify-pickup)', pickupVerify.status === 200 && pickupVerify.data.status === 'COLLECTED');

  const transitUpdate = await request(`/api/donations/${createdDonation.id}/transit-progress`, {
    method: 'PUT',
    body: { progress: 100 },
  });
  assert('8.4 Telemetry transit update to 100% (/api/donations/:id/transit-progress)', transitUpdate.status === 200 && transitUpdate.data.status === 'DELIVERED');

  // 9. Stage 3 Final Receiver Verification & Closure
  const finalVerify = await request(`/api/donations/${createdDonation.id}/verify-receiver`, {
    method: 'POST',
    body: {
      receiverName: 'Sister Mary (Asha Shelter)',
      verifiedQuantity: 40,
      conditionAccepted: 'Fresh',
      remarks: 'Inspected containers and delivered hot meals to all 60 residents.',
    },
  });
  assert('9. Stage 3 Final Receiver Verification & Traceability Closure (/api/donations/:id/verify-receiver)', finalVerify.status === 200 && finalVerify.data.status === 'COMPLETED');

  // 10. Notifications
  const notifs = await request('/api/notifications');
  assert('10.1 List notifications (/api/notifications)', notifs.status === 200 && Array.isArray(notifs.data) && notifs.data.length > 0);

  const readAll = await request('/api/notifications/read-all', { method: 'PUT' });
  assert('10.2 Mark notifications read (/api/notifications/read-all)', readAll.status === 200 && readAll.data.success);

  // 11. What-If Simulator
  const sim = await request('/api/simulator/simulate', {
    method: 'POST',
    body: { mealCount: 80 },
  });
  assert(
    '11. What-If Redistribution Simulator Engine (/api/simulator/simulate)',
    sim.status === 200 && sim.data.peopleFed > 0 && sim.data.co2AvoidedKg > 0,
    `Meals: 80 -> People fed: ${sim.data?.peopleFed}, CO2 avoided: ${sim.data?.co2AvoidedKg} kg, Transport: ${sim.data?.transportVehicle}`
  );

  // 12. Memberships
  const plans = await request('/api/memberships/plans');
  assert('12.1 Query membership tiers (/api/memberships/plans)', plans.status === 200 && plans.data.length === 3);

  const sub = await request('/api/memberships/subscribe', {
    method: 'POST',
    body: { userId: 'donor_1', planId: 'quarterly' },
  });
  assert('12.2 Simulated subscription & CSR certificate (/api/memberships/subscribe)', sub.status === 200 && sub.data.success && !!sub.data.receipt?.transactionId);

  // 13. Admin Governance Scorecard & CSV Audit Export
  const metrics = await request('/api/admin/metrics');
  assert(
    '13.1 Platform Governance Telemetry Scorecard (/api/admin/metrics)',
    metrics.status === 200 && metrics.data.totalDonations > 0 && typeof metrics.data.totalFoodWeightKg === 'number',
    `Total donations: ${metrics.data?.totalDonations}, Food weight: ${metrics.data?.totalFoodWeightKg} kg, Redistribution rate: ${metrics.data?.redistributionRatePct}%`
  );

  const csv = await request('/api/admin/audit-export');
  assert('13.2 Downloadable Chain-of-Custody CSV Export (/api/admin/audit-export)', csv.status === 200 && typeof csv.data === 'string' && csv.data.includes('Donation ID'));

  console.log(`\n=========================================================`);
  console.log(`🏁 VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(`=========================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
