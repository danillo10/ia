import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../componentes/c9_botao_gradiente.dart';
import '../componentes/c9_card.dart';
import '../componentes/c9_fundo.dart';
import '../componentes/logo_minutask.dart';
import '../componentes/menu_logo_sheet.dart';
import '../core/formato_data.dart';
import '../core/localizacao_util.dart';
import '../core/config.dart';
import '../servicos/api_service.dart';
import '../servicos/notificacao_local.dart';
import '../telas/chat_tela.dart';
import '../tema/app_theme.dart';

class DashboardContratanteTela extends StatefulWidget {
  final ApiService api;
  const DashboardContratanteTela({super.key, required this.api});

  @override
  State<DashboardContratanteTela> createState() => _DashboardContratanteTelaState();
}

class _DashboardContratanteTelaState extends State<DashboardContratanteTela> {
  final _descricao = TextEditingController();
  final _categoria = TextEditingController();
  final _valorFixo = TextEditingController(text: '80');
  final _latManual = TextEditingController();
  final _lonManual = TextEditingController();

  bool _salvando = false;
  double? _latPonto;
  double? _lonPonto;
  WebSocketChannel? _canalNotificacoes;
  final _seletorFotos = ImagePicker();
  final List<XFile> _fotosSelecionadas = [];
  final Map<String, Uint8List> _previewFotos = {};
  late DateTime _dataServico;
  late TimeOfDay _horaServico;

  void _definirDataHoraAgora() {
    final agora = DateTime.now();
    _dataServico = DateTime(agora.year, agora.month, agora.day);
    _horaServico = TimeOfDay(hour: agora.hour, minute: agora.minute);
  }

  DateTime get _agendadoLocal =>
      FormatoData.combinar(_dataServico, _horaServico.hour, _horaServico.minute);

  @override
  void initState() {
    super.initState();
    _definirDataHoraAgora();
    _conectarNotificacoes();
  }

  @override
  void dispose() {
    _canalNotificacoes?.sink.close();
    _descricao.dispose();
    _categoria.dispose();
    _valorFixo.dispose();
    _latManual.dispose();
    _lonManual.dispose();
    super.dispose();
  }

  void _conectarNotificacoes() {
    final id = widget.api.usuarioId;
    if (id == null) return;
    _canalNotificacoes?.sink.close();
    _canalNotificacoes = WebSocketChannel.connect(Uri.parse(Config.wsContratante(id)));
    _canalNotificacoes!.stream.listen((raw) {
      final dados = jsonDecode(raw as String) as Map<String, dynamic>;
      final evento = dados['evento']?.toString();
      if (evento == 'chat_mensagem') {
        if (dados['minha'] == true) return;
        final tarefaId = dados['tarefa_id'] as int?;
        if (tarefaId != null && ChatTela.tarefaAbertaId == tarefaId) return;
        NotificacaoLocal.instancia.alertaNovaMensagem(
          tarefaId: tarefaId ?? 0,
          remetente: dados['remetente_nome']?.toString() ?? 'Trabalhador',
          texto: dados['texto']?.toString() ?? '',
        );
      } else if (evento == 'tarefa_aceita') {
        NotificacaoLocal.instancia.alertaPedidoAceito(
          tarefaId: dados['tarefa_id'] as int? ?? 0,
          descricao: dados['descricao']?.toString() ?? 'Seu pedido foi aceito',
        );
      }
    });
  }

  void _snack(String msg, {Color? cor}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: cor,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  Future<({double lat, double lon})?> _resolverLocalPonto() async {
    final latManual = double.tryParse(_latManual.text.trim().replaceAll(',', '.'));
    final lonManual = double.tryParse(_lonManual.text.trim().replaceAll(',', '.'));
    if (latManual != null && lonManual != null) {
      return (lat: latManual, lon: lonManual);
    }
    if (_latPonto != null && _lonPonto != null) {
      return (lat: _latPonto!, lon: _lonPonto!);
    }
    final pos = await LocalizacaoUtil.obter();
    if (pos == null) return null;
    setState(() {
      _latPonto = pos.lat;
      _lonPonto = pos.lon;
    });
    return pos;
  }

  Future<void> _definirPonto() async {
    try {
      final pos = await LocalizacaoUtil.obter();
      if (pos == null) return;
      setState(() {
        _latPonto = pos.lat;
        _lonPonto = pos.lon;
      });
      _snack('Localização definida');
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _adicionarFotos() async {
    if (_fotosSelecionadas.length >= 5) {
      _snack('Máximo de 5 fotos por pedido');
      return;
    }
    try {
      final restantes = 5 - _fotosSelecionadas.length;
      final escolhidas = await _seletorFotos.pickMultiImage(imageQuality: 82);
      if (escolhidas.isEmpty) return;
      for (final foto in escolhidas.take(restantes)) {
        _fotosSelecionadas.add(foto);
        _previewFotos[foto.path] = await foto.readAsBytes();
      }
      if (mounted) setState(() {});
    } catch (e) {
      _snack('Não foi possível selecionar fotos');
    }
  }

  void _removerFoto(int index) {
    final foto = _fotosSelecionadas.removeAt(index);
    _previewFotos.remove(foto.path);
    setState(() {});
  }

  Widget _secaoFotos() {
    return C9Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Fotos do serviço (opcional)',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            'Mostre o local, o problema ou referência visual — até 5 fotos',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          if (_fotosSelecionadas.isNotEmpty)
            SizedBox(
              height: 84,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _fotosSelecionadas.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final foto = _fotosSelecionadas[i];
                  final bytes = _previewFotos[foto.path];
                  return Stack(
                    clipBehavior: Clip.none,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: bytes != null
                            ? Image.memory(bytes, width: 84, height: 84, fit: BoxFit.cover)
                            : Container(
                                width: 84,
                                height: 84,
                                color: MinutaskCores.superficie,
                                child: const Icon(Icons.image),
                              ),
                      ),
                      Positioned(
                        top: -6,
                        right: -6,
                        child: IconButton(
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.black54,
                            padding: const EdgeInsets.all(4),
                            minimumSize: const Size(28, 28),
                          ),
                          onPressed: () => _removerFoto(i),
                          icon: const Icon(Icons.close, size: 16, color: Colors.white),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _fotosSelecionadas.length >= 5 ? null : _adicionarFotos,
            icon: const Icon(Icons.add_photo_alternate_outlined),
            label: Text(
              _fotosSelecionadas.isEmpty ? 'Adicionar fotos' : 'Adicionar mais (${_fotosSelecionadas.length}/5)',
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _escolherData() async {
    final hoje = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dataServico,
      firstDate: DateTime(hoje.year, hoje.month, hoje.day),
      lastDate: hoje.add(const Duration(days: 365)),
      helpText: 'Data do serviço',
      cancelText: 'Cancelar',
      confirmText: 'OK',
    );
    if (picked == null || !mounted) return;
    setState(() => _dataServico = picked);
  }

  Future<void> _escolherHora() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _horaServico,
      helpText: 'Horário do serviço',
      cancelText: 'Cancelar',
      confirmText: 'OK',
    );
    if (picked == null || !mounted) return;
    setState(() => _horaServico = picked);
  }

  Widget _secaoDataHora() {
    final agendadoTxt =
        '${FormatoData.dataCurta(_agendadoLocal)} · ${FormatoData.horaCurta(_agendadoLocal)}';
    return C9Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Text(
                'Quando será o serviço?',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => setState(_definirDataHoraAgora),
                child: const Text('Agora'),
              ),
            ],
          ),
          const SizedBox(height: 4),
          InkWell(
            onTap: _escolherData,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              child: Row(
                children: [
                  Icon(Icons.calendar_today_outlined, color: MinutaskCores.corAccent(MinutaskVariante.contratante)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Data', style: TextStyle(fontSize: 12, color: MinutaskCores.textoMuted)),
                        Text(
                          FormatoData.dataCurta(_dataServico),
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: MinutaskCores.textoMuted),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          InkWell(
            onTap: _escolherHora,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              child: Row(
                children: [
                  Icon(Icons.schedule_outlined, color: MinutaskCores.corAccent(MinutaskVariante.contratante)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Horário', style: TextStyle(fontSize: 12, color: MinutaskCores.textoMuted)),
                        Text(
                          FormatoData.horaCurta(_agendadoLocal),
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: MinutaskCores.textoMuted),
                ],
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Agendado: $agendadoTxt',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: MinutaskCores.ciano.withValues(alpha: 0.9),
                ),
          ),
        ],
      ),
    );
  }

  Future<void> _publicar() async {
    if (_descricao.text.trim().length < 10) {
      _snack('Descreva o serviço (mín. 10 caracteres)');
      return;
    }

    if (_agendadoLocal.isBefore(DateTime.now().subtract(const Duration(minutes: 2)))) {
      _snack('Data e hora não podem ser no passado');
      return;
    }

    setState(() => _salvando = true);
    try {
      final loc = await _resolverLocalPonto();
      if (loc == null) {
        throw Exception('Toque em GPS ou informe latitude e longitude abaixo');
      }
      final valor = double.tryParse(_valorFixo.text.replaceAll(',', '.'));
      if (valor == null || valor <= 0) {
        throw Exception('Informe um valor inicial válido (ex.: 80)');
      }

      final payload = <String, dynamic>{
        'descricao': _descricao.text.trim(),
        'categoria': _categoria.text.trim().isEmpty ? null : _categoria.text.trim(),
        'tipo_loc': 'ponto',
        'agendado_para': FormatoData.paraApi(_agendadoLocal),
        'lat': loc.lat,
        'lon': loc.lon,
        'valor_fixo': valor,
      };

      final res = await widget.api.criarTarefa(payload);
      if (_fotosSelecionadas.isNotEmpty) {
        await widget.api.enviarFotosTarefa(res['id'] as int, List.from(_fotosSelecionadas));
      }
      if (!mounted) return;
      _snack(
        'Pedido #${res['id']} publicado! Valor R\$ ${res['valor_publicado']} (2 min para aceite).',
        cor: MinutaskCores.verde.withValues(alpha: 0.9),
      );
      _descricao.clear();
      setState(() {
        _latPonto = null;
        _lonPonto = null;
        _fotosSelecionadas.clear();
        _previewFotos.clear();
        _definirDataHoraAgora();
      });
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _salvando = false);
    }
  }

  void _abrirMenu() {
    MenuLogoSheet.mostrar(context, api: widget.api);
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
              title: LogoMinutask(
                variante: MinutaskVariante.contratante,
                tamanho: 32,
                mostrarTexto: true,
                mostrarIndicadorMenu: true,
                onTap: _abrirMenu,
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  Text(
                    'Novo pedido',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(fontSize: 26),
                  ),
                  const SizedBox(height: 16),
                  C9Card(
                    child: Column(
                      children: [
                        TextField(
                          controller: _descricao,
                          maxLines: 4,
                          decoration: const InputDecoration(
                            labelText: 'Descrição do serviço',
                            alignLabelWithHint: true,
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _categoria,
                          decoration: const InputDecoration(
                            labelText: 'Categoria',
                            prefixIcon: Icon(Icons.category_outlined),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  _secaoDataHora(),
                  const SizedBox(height: 12),
                  C9Card(
                    child: Column(
                      children: [
                        ListTile(
                          leading: const Icon(Icons.place),
                          title: Text(
                            _latPonto != null
                                ? '${_latPonto!.toStringAsFixed(4)}, ${_lonPonto!.toStringAsFixed(4)}'
                                : 'Local do serviço',
                          ),
                          subtitle: const Text('Valor inicial — negociável no chat'),
                          trailing: TextButton(onPressed: _definirPonto, child: const Text('GPS')),
                        ),
                        TextField(
                          controller: _valorFixo,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(
                            labelText: 'Valor inicial (R\$)',
                            helperText: 'Pode ser alterado no chat com o trabalhador',
                            prefixIcon: Icon(Icons.payments_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Ou informe coordenadas (se o GPS falhar no navegador)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _latManual,
                                keyboardType: const TextInputType.numberWithOptions(
                                  decimal: true,
                                  signed: true,
                                ),
                                decoration: const InputDecoration(
                                  labelText: 'Latitude',
                                  hintText: '-23.5505',
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                controller: _lonManual,
                                keyboardType: const TextInputType.numberWithOptions(
                                  decimal: true,
                                  signed: true,
                                ),
                                decoration: const InputDecoration(
                                  labelText: 'Longitude',
                                  hintText: '-46.6333',
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  _secaoFotos(),
                  const SizedBox(height: 16),
                  C9BotaoGradiente(
                    texto: 'Publicar (2 min para aceite)',
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
