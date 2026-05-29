import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../core/config.dart';
import 'sessao_armazenamento.dart';

class ApiService {
  final _armazenamento = SessaoArmazenamento();
  String? _token;
  int? usuarioId;
  Map<String, dynamic>? usuario;

  void definirToken(String? token) => _token = token;

  void definirSessao(String token, int id, {Map<String, dynamic>? usuario}) {
    _token = token;
    usuarioId = id;
    this.usuario = usuario;
  }

  Future<void> persistirSessao({String? email, String? senha}) async {
    if (_token == null || usuarioId == null || usuario == null) return;
    await _armazenamento.salvar(_token!, usuario!);
    if (email != null && senha != null) {
      await _armazenamento.salvarCredenciais(email, senha);
    }
  }

  Future<void> limparSessao() async {
    _token = null;
    usuarioId = null;
    usuario = null;
    await _armazenamento.limpar();
  }

  /// Restaura login salvo; valida token na API. Retorna false se expirado/inválido.
  Future<bool> restaurarSessaoSalva({required String papelEsperado}) async {
    final salva = await _armazenamento.carregar();
    if (salva == null) return false;

    definirSessao(
      salva.token,
      salva.usuario['id'] as int,
      usuario: salva.usuario,
    );

    try {
      final perfil = await obterEu();
      if (perfil['papel']?.toString() != papelEsperado) {
        await limparSessao();
        return false;
      }
      definirSessao(salva.token, perfil['id'] as int, usuario: perfil);
      await persistirSessao();
      return true;
    } catch (_) {
      await limparSessao();
      return false;
    }
  }

  Future<Map<String, dynamic>> obterEu() async {
    final res = await http.get(
      Uri.parse('${Config.apiBase}/auth/eu'),
      headers: _headers,
    );
    if (res.statusCode == 401) {
      throw Exception('Sessão expirada');
    }
    final body = _decodificar(res);
    if (res.statusCode >= 400) {
      throw Exception(_mensagemErro(res.statusCode, body));
    }
    return Map<String, dynamic>.from((body as Map)['usuario'] as Map);
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  String _mensagemErro(int status, dynamic body) {
    if (body is Map && body['detail'] != null) {
      final detalhe = body['detail'];
      if (detalhe is String) return detalhe;
      if (detalhe is List) {
        return detalhe
            .map((e) => e is Map ? (e['msg'] ?? e.toString()) : e.toString())
            .join('\n');
      }
    }
    return 'Erro na requisição (HTTP $status)';
  }

  dynamic _decodificar(http.Response res) {
    if (res.body.isEmpty) {
      throw Exception('Servidor sem resposta (HTTP ${res.statusCode})');
    }
    try {
      return jsonDecode(res.body);
    } catch (_) {
      throw Exception('Resposta inválida do servidor (HTTP ${res.statusCode})');
    }
  }

  Future<Map<String, dynamic>> entrar(String email, String senha) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/auth/entrar'),
      headers: _headers,
      body: jsonEncode({'email': email, 'senha': senha}),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) {
      throw Exception(_mensagemErro(res.statusCode, body));
    }
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> estimarTarefa(Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/contratante/tarefas/estimar'),
      headers: _headers,
      body: jsonEncode(payload),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) {
      throw Exception(_mensagemErro(res.statusCode, body));
    }
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> criarTarefa(Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/contratante/tarefas'),
      headers: _headers,
      body: jsonEncode(payload),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) {
      throw Exception(_mensagemErro(res.statusCode, body));
    }
    return Map<String, dynamic>.from(body as Map);
  }

  Future<List<Map<String, dynamic>>> listarTarefas() async {
    final res = await http.get(
      Uri.parse('${Config.apiBase}/contratante/tarefas'),
      headers: _headers,
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) {
      throw Exception(_mensagemErro(res.statusCode, body));
    }
    return (body as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> reenviarTarefa(int id, Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/contratante/tarefas/$id/reenviar'),
      headers: _headers,
      body: jsonEncode(payload),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) {
      throw Exception(_mensagemErro(res.statusCode, body));
    }
    return Map<String, dynamic>.from(body as Map);
  }

  Future<List<Map<String, dynamic>>> listarMensagens(int tarefaId) async {
    final res = await http.get(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/mensagens'),
      headers: _headers,
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return (body as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> enviarMensagem(int tarefaId, String texto) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/mensagens'),
      headers: _headers,
      body: jsonEncode({'texto': texto}),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> resumoChat(int tarefaId) async {
    final res = await http.get(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/resumo'),
      headers: _headers,
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> proporValor(int tarefaId, double valor) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/propor-valor'),
      headers: _headers,
      body: jsonEncode({'valor': valor}),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> responderProposta(
    int tarefaId,
    int mensagemId,
    bool aceitar,
  ) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/propostas/$mensagemId/responder'),
      headers: _headers,
      body: jsonEncode({'aceitar': aceitar}),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return Map<String, dynamic>.from(body as Map);
  }

  Future<void> enviarFotosTarefa(int tarefaId, List<XFile> fotos) async {
    if (fotos.isEmpty) return;

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${Config.apiBase}/contratante/tarefas/$tarefaId/fotos'),
    );
    if (_token != null) {
      request.headers['Authorization'] = 'Bearer $_token';
    }

    for (var i = 0; i < fotos.length; i++) {
      final bytes = await fotos[i].readAsBytes();
      final nome = fotos[i].name.isNotEmpty ? fotos[i].name : 'foto_$i.jpg';
      request.files.add(http.MultipartFile.fromBytes('fotos', bytes, filename: nome));
    }

    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    final body = _decodificar(res);
    if (res.statusCode >= 400) {
      throw Exception(_mensagemErro(res.statusCode, body));
    }
  }
}
