import 'package:flutter/material.dart';
import '../tema/app_theme.dart';
import 'c9_botao_gradiente.dart';
import 'c9_card.dart';

/// Aviso de credibilidade antes de aceitar um microjob.
class DialogoCredibilidadeAceite extends StatelessWidget {
  final String descricao;

  const DialogoCredibilidadeAceite({super.key, required this.descricao});

  static Future<bool?> mostrar(BuildContext context, {required String descricao}) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => DialogoCredibilidadeAceite(descricao: descricao),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: C9Card(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: MinutaskCores.gradienteMarca(MinutaskVariante.trabalhador),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.verified_user_outlined, color: Colors.white),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Compromisso com qualidade',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: MinutaskCores.alerta.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: MinutaskCores.alerta.withValues(alpha: 0.35)),
              ),
              child: Text(
                descricao,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Aceite somente se souber realizar esta atividade com segurança e qualidade. '
              'Cancelamentos indevidos ou serviços mal executados podem resultar em '
              'suspensão ou banimento da plataforma, para manter a credibilidade de todos.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.45),
            ),
            const SizedBox(height: 8),
            Text(
              'Ao confirmar, você abrirá o chat com o contratante para combinar detalhes.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 24),
            C9BotaoGradiente(
              texto: 'Sim, aceito e assumo',
              icone: Icons.check_rounded,
              variante: MinutaskVariante.trabalhador,
              onPressed: () => Navigator.pop(context, true),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar'),
            ),
          ],
        ),
      ),
    );
  }
}
