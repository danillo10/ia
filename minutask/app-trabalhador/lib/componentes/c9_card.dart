import 'package:flutter/material.dart';
import '../tema/app_theme.dart';

class C9Card extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool hoverGlow;
  final VoidCallback? onTap;

  const C9Card({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.hoverGlow = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: MinutaskCores.superficie.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: MinutaskCores.borda),
        boxShadow: hoverGlow
            ? [
                BoxShadow(
                  color: MinutaskCores.azul.withValues(alpha: 0.15),
                  blurRadius: 32,
                  spreadRadius: 0,
                ),
              ]
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.25),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
      ),
      child: child,
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: card,
      ),
    );
  }
}
