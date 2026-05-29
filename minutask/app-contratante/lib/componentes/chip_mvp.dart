import 'package:flutter/material.dart';
import '../tema/app_theme.dart';

class ChipMvp extends StatelessWidget {
  final String texto;

  const ChipMvp({super.key, required this.texto});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: MinutaskCores.azul.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: MinutaskCores.azul.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.flash_on_rounded, size: 14, color: MinutaskCores.ciano),
          const SizedBox(width: 6),
          Text(
            texto,
            style: const TextStyle(
              color: MinutaskCores.ciano,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
