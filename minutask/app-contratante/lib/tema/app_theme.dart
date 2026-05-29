import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum MinutaskVariante { contratante, trabalhador }

/// Paleta inspirada no C9digital (navy + azul #0077FF + roxo #7B2FBE)
class MinutaskCores {
  static const fundo = Color(0xFF080D1A);
  static const superficie = Color(0xFF0F1629);
  static const superficieVidro = Color(0x990F1629);
  static const borda = Color(0x1AFFFFFF);
  static const bordaForte = Color(0x33FFFFFF);
  static const texto = Color(0xFFFFFFFF);
  static const textoSuave = Color(0x99FFFFFF);
  static const textoMuted = Color(0x66FFFFFF);
  static const azul = Color(0xFF0077FF);
  static const roxo = Color(0xFF7B2FBE);
  static const ciano = Color(0xFF22D3EE);
  static const verde = Color(0xFF10B981);
  static const alerta = Color(0xFFF59E0B);

  static LinearGradient gradienteMarca(MinutaskVariante v) {
    if (v == MinutaskVariante.trabalhador) {
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [azul, ciano],
      );
    }
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [azul, roxo],
    );
  }

  static Color corAccent(MinutaskVariante v) =>
      v == MinutaskVariante.trabalhador ? ciano : azul;
}

ThemeData temaMinutask(MinutaskVariante variante) {
  final accent = MinutaskCores.corAccent(variante);
  final displayFont = GoogleFonts.plusJakartaSans();
  final bodyFont = GoogleFonts.inter();

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: MinutaskCores.fundo,
    fontFamily: bodyFont.fontFamily,
    colorScheme: ColorScheme.dark(
      primary: accent,
      onPrimary: Colors.white,
      secondary: MinutaskCores.roxo,
      surface: MinutaskCores.superficie,
      onSurface: MinutaskCores.texto,
      outline: MinutaskCores.bordaForte,
    ),
    textTheme: TextTheme(
      displaySmall: displayFont.copyWith(
        fontSize: 28,
        fontWeight: FontWeight.w800,
        color: MinutaskCores.texto,
        height: 1.15,
      ),
      titleLarge: displayFont.copyWith(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        color: MinutaskCores.texto,
      ),
      titleMedium: bodyFont.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: MinutaskCores.texto,
      ),
      bodyLarge: bodyFont.copyWith(color: MinutaskCores.texto),
      bodyMedium: bodyFont.copyWith(color: MinutaskCores.textoSuave),
      bodySmall: bodyFont.copyWith(color: MinutaskCores.textoMuted, fontSize: 12),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: MinutaskCores.texto,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: displayFont.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: MinutaskCores.texto,
      ),
    ),
    cardTheme: CardThemeData(
      color: MinutaskCores.superficie.withValues(alpha: 0.6),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: MinutaskCores.borda),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.05),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: accent.withValues(alpha: 0.6), width: 1.5),
      ),
      labelStyle: bodyFont.copyWith(
        color: MinutaskCores.textoSuave,
        fontSize: 13,
        fontWeight: FontWeight.w500,
      ),
      hintStyle: bodyFont.copyWith(color: MinutaskCores.textoMuted),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: MinutaskCores.superficie,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}
