import 'package:flutter_test/flutter_test.dart';
import 'package:product_admin_app/main.dart';

void main() {
  testWidgets('App starts with SplashScreen', (WidgetTester tester) async {
    await tester.pumpWidget(const ProductAdminApp());
    expect(find.byType(SplashScreen), findsOneWidget);
  });
}
