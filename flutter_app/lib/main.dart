import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

const _gold = Color(0xFFC5A059);
const _apiUrl = 'https://jumpproptech-api.onrender.com/api';
const _tokenKey = 'access_token';
const _roleKey = 'user_role';

void main() {
  runApp(const JumpPropTechPaymentsApp());
}

class JumpPropTechPaymentsApp extends StatelessWidget {
  const JumpPropTechPaymentsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Jump PropTech Payments',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: _gold),
        scaffoldBackgroundColor: const Color(0xFFF7F5F0),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF171717),
          foregroundColor: Colors.white,
          centerTitle: false,
        ),
        useMaterial3: true,
      ),
      home: const PaymentsHome(),
    );
  }
}

class RentRecord {
  const RentRecord({
    required this.id,
    required this.tenantName,
    required this.unitNumber,
    required this.monthFor,
    required this.amount,
    required this.status,
    this.paymentMethod,
    this.paidDate,
  });

  final int id;
  final String tenantName;
  final String unitNumber;
  final String monthFor;
  final num amount;
  final String status;
  final String? paymentMethod;
  final String? paidDate;

  factory RentRecord.fromJson(Map<String, dynamic> json) {
    final id = int.tryParse('${json['id']}');
    if (id == null) {
      throw const FormatException('A rent record has an invalid ID.');
    }
    return RentRecord(
      id: id,
      tenantName: '${json['tenant_name'] ?? 'Tenant'}',
      unitNumber: '${json['unit_number'] ?? 'N/A'}',
      monthFor: '${json['month_for'] ?? ''}',
      amount: num.tryParse('${json['amount'] ?? 0}') ?? 0,
      status: '${json['status'] ?? 'Pending'}',
      paymentMethod: json['payment_method']?.toString(),
      paidDate: json['paid_date']?.toString(),
    );
  }
}

class PaymentApi {
  PaymentApi(this._storage);

  final FlutterSecureStorage _storage;
  final http.Client _client = http.Client();

  Future<String?> readToken() => _storage.read(key: _tokenKey);
  Future<String?> readRole() => _storage.read(key: _roleKey);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _client.post(
      Uri.parse('$_apiUrl/auth/login.php'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = _decodeResponse(response);
    if (data['mfa_required'] == true) {
      throw const ApiException(
        'Multi-factor login is not available in this app yet. Please sign in on the web app.',
      );
    }

    final token = data['token'];
    final user = data['user'];
    if (token is! String || token.isEmpty || user is! Map<String, dynamic>) {
      throw const ApiException(
        'The server returned an invalid sign-in response.',
      );
    }
    final role = user['role']?.toString();
    if (!{'landlord', 'agent', 'superadmin'}.contains(role)) {
      throw const ApiException(
        'This mobile app is for landlord payment management. Sign in with a landlord account.',
      );
    }
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _roleKey, value: role!);
    return user;
  }

  Future<List<RentRecord>> getRentRecords() async {
    final response = await _client.get(
      Uri.parse('$_apiUrl/rent.php'),
      headers: await _headers(),
    );
    final data = _decodeResponse(response);
    if (data is! List) {
      throw const ApiException(
        'The server returned an unexpected rent records response.',
      );
    }
    return data
        .map(
          (item) => RentRecord.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  Future<void> recordPayment(int id, String method) async {
    final response = await _client.post(
      Uri.parse('$_apiUrl/rent.php'),
      headers: await _headers(),
      body: jsonEncode({'id': id, 'method': method}),
    );
    _decodeResponse(response);
  }

  Future<void> createLandlord({
    required String fullName,
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      Uri.parse('$_apiUrl/admin/create_landlord.php'),
      headers: await _headers(),
      body: jsonEncode({
        'full_name': fullName,
        'email': email,
        'password': password,
      }),
    );
    _decodeResponse(response);
  }

  Future<Map<String, String>> _headers() async {
    final token = await readToken();
    if (token == null || token.isEmpty) {
      throw const ApiException(
        'Your session has expired. Please sign in again.',
      );
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  dynamic _decodeResponse(http.Response response) {
    dynamic data;
    try {
      data = jsonDecode(response.body);
    } on FormatException {
      throw const ApiException(
        'The server returned an unexpected response. Please try again.',
      );
    }
    if (response.statusCode == 401) {
      _storage.delete(key: _tokenKey);
      throw const ApiException(
        'Your session has expired. Please sign in again.',
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = data is Map ? data['message'] ?? data['error'] : null;
      throw ApiException(
        message is String
            ? message
            : 'Request failed (${response.statusCode}).',
      );
    }
    return data;
  }
}

class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class PaymentsHome extends StatefulWidget {
  const PaymentsHome({super.key});

  @override
  State<PaymentsHome> createState() => _PaymentsHomeState();
}

class _PaymentsHomeState extends State<PaymentsHome> {
  final _storage = const FlutterSecureStorage();
  late final PaymentApi _api = PaymentApi(_storage);
  bool _checkingSession = true;
  bool _signedIn = false;
  String? _role;
  String _userName = '';
  String? _loadError;
  bool _loadingRecords = false;
  String _statusFilter = 'All';
  List<RentRecord> _records = [];

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final token = await _api.readToken();
    final role = await _api.readRole();
    if (!mounted) return;
    if (token != null && token.isNotEmpty) {
      if ({'landlord', 'agent', 'superadmin'}.contains(role)) {
        setState(() {
          _signedIn = true;
          _role = role;
        });
        await _loadRecords();
      } else {
        await _signOut();
      }
    }
    if (mounted) setState(() => _checkingSession = false);
  }

  Future<void> _loadRecords() async {
    setState(() {
      _loadingRecords = true;
      _loadError = null;
    });
    try {
      final records = await _api.getRentRecords();
      if (mounted) setState(() => _records = records);
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.message.contains('session has expired')) {
        await _signOut();
      } else {
        setState(() => _loadError = error.message);
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _loadError = 'Could not load rent records. Check your connection and try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _loadingRecords = false);
    }
  }

  Future<void> _signOut() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _roleKey);
    if (!mounted) return;
    setState(() {
      _signedIn = false;
      _role = null;
      _records = [];
      _userName = '';
      _loadError = null;
    });
  }

  Future<void> _recordPayment(RentRecord record, String method) async {
    await _api.recordPayment(record.id, method);
    if (!mounted) return;
    try {
      final records = await _api.getRentRecords();
      if (!mounted) return;
      setState(() {
        _records = records;
        _loadError = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment recorded successfully.')),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _loadError = error.message);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Payment recorded. Refresh the list to see the updated status.',
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(
        () => _loadError =
            'Payment recorded, but rent records could not be refreshed.',
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Payment recorded. Refresh the list to see the updated status.',
          ),
        ),
      );
    }
  }

  Future<void> _showPaymentDialog(RentRecord record) async {
    await showDialog<void>(
      context: context,
      builder: (context) => RecordPaymentDialog(
        record: record,
        onConfirm: (method) => _recordPayment(record, method),
      ),
    );
  }

  Future<void> _showCreateLandlordDialog() async {
    final created = await showDialog<bool>(
      context: context,
      builder: (context) => CreateLandlordDialog(onCreate: _api.createLandlord),
    );
    if (created == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Landlord account created successfully.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingSession) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return _signedIn ? _buildRecordsPage() : _buildLoginPage();
  }

  Widget _buildLoginPage() {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: LoginForm(
                onLogin: (email, password) async {
                  final user = await _api.login(email, password);
                  if (!mounted) return;
                  setState(() {
                    _signedIn = true;
                    _role = '${user['role']}';
                    _userName = '${user['full_name'] ?? ''}';
                  });
                  await _loadRecords();
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRecordsPage() {
    final pendingCount = _records
        .where((record) => record.status.toLowerCase() != 'paid')
        .length;
    final visibleRecords = _records.where((record) {
      if (_statusFilter == 'Paid') return record.status.toLowerCase() == 'paid';
      if (_statusFilter == 'Awaiting') {
        return record.status.toLowerCase() != 'paid';
      }
      return true;
    }).toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Rent payments',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          if (_role == 'superadmin')
            IconButton(
              tooltip: 'Create landlord account',
              onPressed: _showCreateLandlordDialog,
              icon: const Icon(Icons.person_add_alt_1),
            ),
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loadingRecords ? null : _loadRecords,
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Sign out',
            onPressed: _signOut,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadRecords,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              _userName.isEmpty ? 'Payment overview' : 'Hello, $_userName',
              style: Theme.of(context).textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              '$pendingCount rent payment${pendingCount == 1 ? '' : 's'} awaiting confirmation',
              style: Theme.of(context).textTheme.bodyMedium
                  ?.copyWith(color: Colors.black54),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              children: ['All', 'Awaiting', 'Paid'].map((filter) {
                final count = filter == 'All'
                    ? _records.length
                    : filter == 'Paid'
                    ? _records.length - pendingCount
                    : pendingCount;
                return ChoiceChip(
                  label: Text('$filter ($count)'),
                  selected: _statusFilter == filter,
                  onSelected: (_) => setState(() => _statusFilter = filter),
                );
              }).toList(),
            ),
            if (_loadingRecords && _records.isNotEmpty) ...[
              const SizedBox(height: 12),
              const LinearProgressIndicator(),
            ],
            const SizedBox(height: 8),
            if (_loadError != null)
              Card(
                color: Colors.red.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _loadError!,
                        style: TextStyle(color: Colors.red.shade900),
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: _loadRecords,
                          child: const Text('Try again'),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else if (_loadingRecords && _records.isEmpty)
              const Padding(
                padding: EdgeInsets.all(48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_records.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'No rent records found. Add a tenant to create a rent record.',
                  ),
                ),
              )
            else if (visibleRecords.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'No ${_statusFilter.toLowerCase()} payments found.',
                  ),
                ),
              )
            else
              ...visibleRecords.map(_buildRecordCard),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordCard(RentRecord record) {
    final isPaid = record.status.toLowerCase() == 'paid';
    final statusColor = isPaid
        ? Colors.green.shade700
        : record.status.toLowerCase() == 'overdue'
        ? Colors.red.shade700
        : Colors.orange.shade800;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        record.tenantName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 17,
                        ),
                      ),
                      Text(
                        'Unit ${record.unitNumber} · ${_formatMonth(record.monthFor)}',
                        style: const TextStyle(color: Colors.black54),
                      ),
                    ],
                  ),
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    child: Text(
                      record.status,
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              'R ${record.amount}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
            ),
            if (isPaid)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Paid via ${record.paymentMethod ?? 'payment'}${record.paidDate == null ? '' : ' · ${record.paidDate}'}',
                  style: TextStyle(
                    color: Colors.green.shade700,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )
            else ...[
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: _gold,
                    foregroundColor: Colors.black,
                  ),
                  onPressed: () => _showPaymentDialog(record),
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text(
                    'Record payment received',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class LoginForm extends StatefulWidget {
  const LoginForm({required this.onLogin, super.key});

  final Future<void> Function(String email, String password) onLogin;

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _obscurePassword = true;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.onLogin(_email.text.trim(), _password.text);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error =
              'Unable to sign in. Check your connection and try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                Icons.account_balance_wallet_outlined,
                size: 44,
                color: _gold,
              ),
              const SizedBox(height: 12),
              Text(
                'Jump PropTech',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              const Text(
                'Landlord payment management',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.username],
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                validator: (value) => value == null || !value.contains('@')
                    ? 'Enter a valid email address.'
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _password,
                obscureText: _obscurePassword,
                autofillHints: const [AutofillHints.password],
                onFieldSubmitted: (_) => _submit(),
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    tooltip: _obscurePassword
                        ? 'Show password'
                        : 'Hide password',
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                  ),
                ),
                validator: (value) => value == null || value.isEmpty
                    ? 'Enter your password.'
                    : null,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: TextStyle(color: Colors.red.shade700),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 20),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: _gold,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text(
                        'Sign in',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Use your existing landlord account.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CreateLandlordDialog extends StatefulWidget {
  const CreateLandlordDialog({required this.onCreate, super.key});

  final Future<void> Function({
    required String fullName,
    required String email,
    required String password,
  })
  onCreate;

  @override
  State<CreateLandlordDialog> createState() => _CreateLandlordDialogState();
}

class _CreateLandlordDialogState extends State<CreateLandlordDialog> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _busy = false;
  bool _obscurePassword = true;
  String? _error;

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.onCreate(
        fullName: _fullName.text.trim(),
        email: _email.text.trim(),
        password: _password.text,
      );
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = 'Could not create the account. Check your connection and try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String? _validatePassword(String? value) {
    final password = value ?? '';
    if (password.length < 12) return 'Use at least 12 characters.';
    if (password.length > 72) return 'Use 72 characters or fewer.';
    if (!RegExp(r'[A-Za-z]').hasMatch(password) ||
        !RegExp(r'[0-9]').hasMatch(password)) {
      return 'Include at least one letter and one number.';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Create landlord account'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'This action is restricted to superadmins. Share the sign-in details with the landlord securely.',
                style: TextStyle(fontSize: 13, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _fullName,
                enabled: !_busy,
                textCapitalization: TextCapitalization.words,
                maxLength: 100,
                decoration: const InputDecoration(
                  labelText: 'Full name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter the landlord’s full name.'
                    : null,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _email,
                enabled: !_busy,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  final email = value?.trim() ?? '';
                  return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)
                      ? null
                      : 'Enter a valid email address.';
                },
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _password,
                enabled: !_busy,
                obscureText: _obscurePassword,
                validator: _validatePassword,
                decoration: InputDecoration(
                  labelText: 'Initial password',
                  helperText:
                      'At least 12 characters, with a letter and number.',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    tooltip: _obscurePassword
                        ? 'Show password'
                        : 'Hide password',
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _confirmPassword,
                enabled: !_busy,
                obscureText: _obscurePassword,
                decoration: const InputDecoration(
                  labelText: 'Confirm password',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value != _password.text ? 'Passwords do not match.' : null,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: TextStyle(color: Colors.red.shade700)),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _busy ? null : () => Navigator.of(context).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: _gold,
            foregroundColor: Colors.black,
          ),
          onPressed: _busy ? null : _submit,
          child: _busy
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Create account'),
        ),
      ],
    );
  }
}

class RecordPaymentDialog extends StatefulWidget {
  const RecordPaymentDialog({
    required this.record,
    required this.onConfirm,
    super.key,
  });

  final RentRecord record;
  final Future<void> Function(String method) onConfirm;

  @override
  State<RecordPaymentDialog> createState() => _RecordPaymentDialogState();
}

class _RecordPaymentDialogState extends State<RecordPaymentDialog> {
  static const _methods = ['EFT', 'Cash', 'SnapScan', 'Other'];
  String _method = 'EFT';
  final _other = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _other.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final method = _method == 'Other' ? _other.text.trim() : _method;
    if (method.isEmpty || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.onConfirm(method);
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = 'Payment could not be recorded. Please try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Record payment'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${widget.record.tenantName} · Unit ${widget.record.unitNumber}',
            ),
            Text(
              'R ${widget.record.amount} · ${_formatMonth(widget.record.monthFor)}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text('How was the rent paid?'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _methods.map((method) {
                return ChoiceChip(
                  label: Text(method),
                  selected: _method == method,
                  onSelected: _busy
                      ? null
                      : (_) => setState(() => _method = method),
                );
              }).toList(),
            ),
            if (_method == 'Other') ...[
              const SizedBox(height: 8),
              TextField(
                controller: _other,
                enabled: !_busy,
                maxLength: 60,
                decoration: const InputDecoration(
                  labelText: 'Payment method',
                  border: OutlineInputBorder(),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ],
            const SizedBox(height: 8),
            const Text(
              'Only confirm after you have verified that the payment was received.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: Colors.red.shade700)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _busy ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: _gold,
            foregroundColor: Colors.black,
          ),
          onPressed: _busy || (_method == 'Other' && _other.text.trim().isEmpty)
              ? null
              : _confirm,
          child: _busy
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Confirm received'),
        ),
      ],
    );
  }
}

String _formatMonth(String value) {
  final date = DateTime.tryParse(value);
  if (date == null) return value.isEmpty ? 'Rent period' : value;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[date.month - 1]} ${date.year}';
}
