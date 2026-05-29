import 'package:flutter/material.dart';
import '../tema/app_theme.dart';

class C9BotaoGradiente extends StatelessWidget {
  final String texto;
  final VoidCallback? onPressed;
  final bool carregando;
  final IconData? icone;
  final MinutaskVariante variante;

  const C9BotaoGradiente({
    super.key,
    required this.texto,
    required this.onPressed,
    this.carregando = false,
    this.icone,
    this.variante = MinutaskVariante.contratante,
  });

  @override
  Widget build(BuildContext context) {
    final ativo = !carregando && onPressed != null;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: ativo ? onPressed : null,
      child: AnimatedOpacity(
        opacity: ativo ? 1 : 0.65,
        duration: const Duration(milliseconds: 150),
        child: Ink(
          decoration: BoxDecoration(
            gradient: MinutaskCores.gradienteMarca(variante),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: MinutaskCores.azul.withValues(alpha: 0.35),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14),
            alignment: Alignment.center,
            child: carregando
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        texto,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (icone != null) ...[
                        const SizedBox(width: 8),
                        Icon(icone, size: 18, color: Colors.white),
                      ],
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
