import 'package:flutter/material.dart';
import '../tema/app_theme.dart';

/// Fundo estilo C9digital: navy + gradientes radiais + grade sutil
class C9Fundo extends StatelessWidget {
  final MinutaskVariante variante;
  final Widget child;

  const C9Fundo({
    super.key,
    required this.variante,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: MinutaskCores.fundo,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(-0.6, 0.2),
                  radius: 0.9,
                  colors: [
                    MinutaskCores.azul.withValues(alpha: 0.08),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0.8, -0.2),
                  radius: 0.7,
                  colors: [
                    MinutaskCores.roxo.withValues(alpha: 0.08),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          CustomPaint(painter: _GradePainter()),
          child,
        ],
      ),
    );
  }
}

class _GradePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.03)
      ..strokeWidth = 1;
    const step = 40.0;
    for (var x = 0.0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
