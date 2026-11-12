import 'package:flutter_test/flutter_test.dart';
import 'package:jump_proptech_payments/main.dart';

void main() {
  test('parses a rent record from the API response', () {
    final record = RentRecord.fromJson({
      'id': '42',
      'tenant_name': 'A Tenant',
      'unit_number': '3B',
      'month_for': '2026-11-01',
      'amount': '8500.00',
      'status': 'Pending',
      'payment_method': null,
      'paid_date': null,
    });

    expect(record.id, 42);
    expect(record.tenantName, 'A Tenant');
    expect(record.unitNumber, '3B');
    expect(record.amount, 8500.0);
    expect(record.status, 'Pending');
  });
}
