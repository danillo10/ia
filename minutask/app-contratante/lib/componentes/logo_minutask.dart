import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../tema/app_theme.dart';

/// Logo estilo C9digital — quadrado arredondado com gradiente azul→roxo
class LogoMinutask extends StatelessWidget {
  final MinutaskVariante variante;
  final double tamanho;
  final bool mostrarTexto;
  final VoidCallback? onTap;
  final bool mostrarIndicadorMenu;

  const LogoMinutask({
    super.key,
    this.variante = MinutaskVariante.contratante,
    this.tamanho = 40,
    this.mostrarTexto = true,
    this.onTap,
    this.mostrarIndicadorMenu = false,
  });

  @override
  Widget build(BuildContext context) {
    final conteudo = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: tamanho,
          height: tamanho,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(tamanho * 0.25),
            gradient: MinutaskCores.gradienteMarca(variante),
            boxShadow: [
              BoxShadow(
                color: MinutaskCores.azul.withValues(alpha: 0.4),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Icon(
            Icons.bolt_rounded,
            color: Colors.white,
            size: tamanho * 0.55,
          ),
        ),
        if (mostrarTexto) ...[
          SizedBox(width: tamanho * 0.25),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              RichText(
                text: TextSpan(
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: tamanho * 0.45,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                  children: const [
                    TextSpan(
                      text: 'Minu',
                      style: TextStyle(color: Colors.white),
                    ),
                    TextSpan(
                      text: 'task',
                      style: TextStyle(color: MinutaskCores.azul),
                    ),
                  ],
                ),
              ),
              if (tamanho >= 36)
                Text(
                  'Microjobs urgentes',
                  style: GoogleFonts.inter(
                    fontSize: tamanho * 0.22,
                    color: MinutaskCores.textoMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
            ],
          ),
        ],
        if (mostrarIndicadorMenu) ...[
          SizedBox(width: tamanho * 0.15),
          Icon(
            Icons.keyboard_arrow_down_rounded,
            color: MinutaskCores.textoMuted,
            size: tamanho * 0.55,
          ),
        ],
      ],
    );

    if (onTap == null) return conteudo;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
          child: conteudo,
        ),
      ),
    );
  }
}
