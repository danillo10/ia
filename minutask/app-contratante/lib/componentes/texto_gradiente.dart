import 'package:flutter/material.dart';
import '../tema/app_theme.dart';

class TextoGradiente extends StatelessWidget {
  final String texto;
  final TextStyle? style;
  final MinutaskVariante variante;

  const TextoGradiente(
    this.texto, {
    super.key,
    this.style,
    this.variante = MinutaskVariante.contratante,
  });

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      shaderCallback: (bounds) =>
          MinutaskCores.gradienteMarca(variante).createShader(bounds),
      child: Text(
        texto,
        style: (style ?? Theme.of(context).textTheme.displaySmall)?.copyWith(
              color: Colors.white,
            ),
      ),
    );
  }
}
