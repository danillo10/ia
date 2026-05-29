import 'package:flutter/material.dart';
import '../componentes/c9_botao_gradiente.dart';
import '../componentes/c9_card.dart';
import '../componentes/c9_fundo.dart';
import '../componentes/logo_minutask.dart';
import '../core/localizacao_util.dart';
import '../servicos/api_service.dart';
import '../tema/app_theme.dart';

class NovaTarefaTela extends StatefulWidget {
  final ApiService api;
  const NovaTarefaTela({super.key, required this.api});

  @override
  State<NovaTarefaTela> createState() => _NovaTarefaTelaState();
}

class _NovaTarefaTelaState extends State<NovaTarefaTela> {
  final _descricao = TextEditingController();
  final _categoria = TextEditingController();
  final _valor = TextEditingController(text: '80');
  final _latManual = TextEditingController(text: '-23.5505');
  final _lonManual = TextEditingController(text: '-46.6333');
  double? _lat;
  double? _lon;
  bool _salvando = false;

  @override
  void dispose() {
    _descricao.dispose();
    _categoria.dispose();
    _valor.dispose();
    _latManual.dispose();
    _lonManual.dispose();
    super.dispose();
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _obterLocalizacao() async {
    try {
      final pos = await LocalizacaoUtil.obter();
      if (pos == null) return;
      setState(() {
        _lat = pos.lat;
        _lon = pos.lon;
      });
      _snack('Localização definida');
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<({double lat, double lon})?> _resolverLocal() async {
    if (_lat != null && _lon != null) return (lat: _lat!, lon: _lon!);
    final lat = double.tryParse(_latManual.text.trim().replaceAll(',', '.'));
    final lon = double.tryParse(_lonManual.text.trim().replaceAll(',', '.'));
    if (lat != null && lon != null) return (lat: lat, lon: lon);
    try {
      final pos = await LocalizacaoUtil.obter();
      if (pos == null) return null;
      setState(() {
        _lat = pos.lat;
        _lon = pos.lon;
      });
      return pos;
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
      return null;
    }
  }

  Future<void> _publicar() async {
    if (_descricao.text.trim().length < 10) {
      _snack('Descreva o serviço (mín. 10 caracteres)');
      return;
    }

    setState(() => _salvando = true);
    try {
      final loc = await _resolverLocal();
      if (loc == null) {
        _snack('Toque em GPS ou informe latitude/longitude');
        return;
      }
      final valor = double.tryParse(_valor.text.replaceAll(',', '.'));
      if (valor == null || valor <= 0) {
        _snack('Informe um valor fixo válido');
        return;
      }

      final res = await widget.api.criarTarefa({
        'descricao': _descricao.text.trim(),
        'categoria': _categoria.text.trim().isEmpty ? null : _categoria.text.trim(),
        'tipo_loc': 'ponto',
        'valor_fixo': valor,
        'lat': loc.lat,
        'lon': loc.lon,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Tarefa #${res['id']} publicada! Trabalhadores notificados.'),
          backgroundColor: MinutaskCores.verde.withValues(alpha: 0.9),
        ),
      );
      _descricao.clear();
      setState(() {
        _lat = null;
        _lon = null;
      });
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: C9Fundo(
        variante: MinutaskVariante.contratante,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: Colors.transparent,
              title: const LogoMinutask(
                variante: MinutaskVariante.contratante,
                tamanho: 32,
                mostrarTexto: true,
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  Text(
                    'Nova tarefa',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(fontSize: 28),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Descreva o que precisa — todos os trabalhadores online recebem',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 24),
                  C9Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextField(
                          controller: _descricao,
                          maxLines: 5,
                          decoration: const InputDecoration(
                            labelText: 'Descrição',
                            hintText: 'Ex.: Montar móvel, entrega urgente, pintura...',
                            alignLabelWithHint: true,
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _categoria,
                          decoration: const InputDecoration(
                            labelText: 'Categoria',
                            prefixIcon: Icon(Icons.category_outlined),
                            hintText: 'limpeza, entrega, reforma',
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _valor,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(
                            labelText: 'Valor fixo (R\$)',
                            prefixIcon: Icon(Icons.payments_outlined),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  C9Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                gradient: MinutaskCores.gradienteMarca(
                                  MinutaskVariante.contratante,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                _lat != null ? Icons.location_on : Icons.my_location,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Localização',
                                    style: TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                  Text(
                                    _lat != null
                                        ? '${_lat!.toStringAsFixed(4)}, ${_lon!.toStringAsFixed(4)}'
                                        : 'GPS ou coordenadas abaixo',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            TextButton(
                              onPressed: _obterLocalizacao,
                              child: const Text('GPS'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _latManual,
                                decoration: const InputDecoration(labelText: 'Latitude'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                controller: _lonManual,
                                decoration: const InputDecoration(labelText: 'Longitude'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  C9BotaoGradiente(
                    texto: 'Publicar e notificar',
                    icone: Icons.send_rounded,
                    carregando: _salvando,
                    onPressed: _publicar,
                    variante: MinutaskVariante.contratante,
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
