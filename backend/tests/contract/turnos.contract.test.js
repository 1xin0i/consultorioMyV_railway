/** @format */

import {
  request,
  app,
  prepararBase,
  congelarReloj,
  cerrar,
  snap,
  snapDb,
} from "./helpers.js";
import {
  Turno,
  HistorialEstadoTurno,
  PracticaTurno,
} from "../../models/index.model.js";

/**
 * TEST DE CONTRATO - /api/turnos
 * Congela status + body de cada endpoint (incluidos los caminos de error)
 * para garantizar que el refactor no cambie la API.
 * Los snapshots se generaron ANTES del refactor (Fase 0).
 */

const LUN_10 = "2030-01-07T10:00:00-03:00";
const LUN_11 = "2030-01-07T11:00:00-03:00";
const LUN_12 = "2030-01-07T12:00:00-03:00";
const LUN_07 = "2030-01-07T07:00:00-03:00";
const MAR_10 = "2030-01-08T10:00:00-03:00";
const MAR_11 = "2030-01-08T11:00:00-03:00";
const MIE_10 = "2030-01-09T10:00:00-03:00";
const MIE_11 = "2030-01-09T11:00:00-03:00";
const DOM_10 = "2030-01-06T10:00:00-03:00";
const DOM_11 = "2030-01-06T11:00:00-03:00";

describe("Contrato API /api/turnos", () => {
  beforeAll(async () => {
    congelarReloj();
    await prepararBase();
  });
  afterAll(cerrar);

  test("GET /agenda vacío", async () => {
    snap("agenda-vacia", await request(app).get("/api/turnos/agenda"));
  });

  test("POST / validación Zod (400)", async () => {
    snap(
      "crear-zod",
      await request(app).post("/api/turnos").send({ fecha_hora_inicio: LUN_10 }),
    );
  });

  test("POST / crear turno A (201, con práctica)", async () => {
    snap(
      "crear-A",
      await request(app)
        .post("/api/turnos")
        .send({
          id_paciente: 1,
          fecha_hora_inicio: LUN_10,
          duracion_minutos: 30,
          precio_final: 1000,
          notas_consulta: "Control",
          practicas: [1],
        }),
    );
  });

  test("POST / solapamiento (409)", async () => {
    snap(
      "crear-solapado",
      await request(app)
        .post("/api/turnos")
        .send({ id_paciente: 2, fecha_hora_inicio: LUN_10, precio_final: 500 }),
    );
  });

  test("POST / restricción de agenda: domingo (409) y fuera de horario (409)", async () => {
    snap(
      "crear-domingo",
      await request(app)
        .post("/api/turnos")
        .send({ id_paciente: 1, fecha_hora_inicio: DOM_10, precio_final: 500 }),
    );
    snap(
      "crear-fuera-de-horario",
      await request(app)
        .post("/api/turnos")
        .send({ id_paciente: 1, fecha_hora_inicio: LUN_07, precio_final: 500 }),
    );
  });

  test("POST / ignorar restricciones (201) turno B domingo, alias camelCase", async () => {
    snap(
      "crear-B-ignorar",
      await request(app)
        .post("/api/turnos")
        .send({
          id_paciente: 2,
          fecha_hora_inicio: DOM_10,
          duracionMinutos: 45,
          ignorarRestricciones: true,
          precio_final: 700,
        }),
    );
  });

  test("POST / fecha_hora_fin explícita y solapamiento con B", async () => {
    snap(
      "crear-solapa-B",
      await request(app)
        .post("/api/turnos")
        .send({
          id_paciente: 1,
          fecha_hora_inicio: DOM_11.replace("11:00", "10:30"),
          fecha_hora_fin: DOM_11,
          ignorar_restricciones: true,
        }),
    );
  });

  test("POST / práctica inexistente (400, rollback)", async () => {
    snap(
      "crear-practica-inexistente",
      await request(app)
        .post("/api/turnos")
        .send({
          id_paciente: 1,
          fecha_hora_inicio: LUN_11,
          precio_final: 100,
          practicas: [999],
        }),
    );
    // El rollback no debe dejar turno huérfano
    expect(await Turno.count()).toBe(2);
  });

  test("POST / crear turno C (práctica como objeto)", async () => {
    snap(
      "crear-C",
      await request(app)
        .post("/api/turnos")
        .send({
          id_paciente: 1,
          fecha_hora_inicio: LUN_12,
          precio_final: 500,
          practicas: [{ id_practica: 2 }, 2],
        }),
    );
  });

  test("GET /:id (200 y 404)", async () => {
    snap("get-por-id-A", await request(app).get("/api/turnos/1"));
    snap("get-por-id-inexistente", await request(app).get("/api/turnos/9999"));
  });

  test("GET / listados, filtros, búsqueda y orden", async () => {
    snap("lista-default", await request(app).get("/api/turnos"));
    snap(
      "lista-estado-programado",
      await request(app).get("/api/turnos?estadoFiltrado=programado"),
    );
    snap(
      "lista-estado-id-2",
      await request(app).get("/api/turnos?estadoFiltrado=2"),
    );
    snap("lista-mes", await request(app).get("/api/turnos?mes=2030-01"));
    snap("lista-mes-vacio", await request(app).get("/api/turnos?mes=2031-05"));
    snap("lista-search", await request(app).get("/api/turnos?search=Perez"));
    snap(
      "lista-orden-paciente",
      await request(app).get("/api/turnos?sortField=paciente&sortOrder=ASC"),
    );
    snap(
      "lista-orden-estado",
      await request(app).get("/api/turnos?sortField=estado&sortOrder=DESC"),
    );
    snap(
      "lista-orden-honorarios-paginado",
      await request(app).get("/api/turnos?sortField=honorarios&limit=2&page=2"),
    );
  });

  test("GET /agenda con datos y GET /paciente/:id", async () => {
    snap("agenda", await request(app).get("/api/turnos/agenda"));
    snap("por-paciente-1", await request(app).get("/api/turnos/paciente/1"));
    snap("por-paciente-sin-turnos", await request(app).get("/api/turnos/paciente/77"));
  });

  test("PUT /:id actualizar (200), paciente inexistente (400), 404", async () => {
    snap(
      "update-A",
      await request(app)
        .put("/api/turnos/1")
        .send({ precio_final: 1500, notas_consulta: "Nueva nota", practicas: [2] }),
    );
    snap(
      "update-paciente-inexistente",
      await request(app).put("/api/turnos/1").send({ id_paciente: 555 }),
    );
    snap("update-404", await request(app).put("/api/turnos/9999").send({ precio_final: 1 }));
    snap("update-zod", await request(app).put("/api/turnos/1").send({ precio_final: -5 }));
  });

  test("PATCH /:id/atender (200), repetido (400), práctica inexistente (400), 404", async () => {
    snap(
      "atender-A",
      await request(app)
        .patch("/api/turnos/1/atender")
        .send({
          notas_consulta: "Atendido ok",
          precio_final: 1200,
          practicas: [{ id_practica: 1, id_obra_social: null }, { id_practica: 2 }],
        }),
    );
    snap("atender-A-repetido", await request(app).patch("/api/turnos/1/atender").send({}));
    snap(
      "atender-practica-inexistente",
      await request(app)
        .patch("/api/turnos/3/atender")
        .send({ practicas: [{ id_practica: 999 }] }),
    );
    snap("atender-404", await request(app).patch("/api/turnos/9999/atender").send({}));
  });

  test("GET /atendidos (A atendido, sin solicitud de cobro)", async () => {
    snap("atendidos-sin-cobro", await request(app).get("/api/turnos/atendidos"));
  });

  test("PATCH /:id/cancelar (200) y repetido (400)", async () => {
    snap(
      "cancelar-C",
      await request(app).patch("/api/turnos/3/cancelar").send({ notas_consulta: "Paciente avisó" }),
    );
    snap("cancelar-C-repetido", await request(app).patch("/api/turnos/3/cancelar").send({}));
    snap("cancelar-A-atendido", await request(app).patch("/api/turnos/1/cancelar").send({}));
  });

  test("PATCH /:id/inasistente + cancelar desde inasistente", async () => {
    snap(
      "crear-D",
      await request(app)
        .post("/api/turnos")
        .send({ id_paciente: 2, fecha_hora_inicio: MAR_10, precio_final: 300 }),
    );
    snap(
      "inasistente-D",
      await request(app).patch("/api/turnos/4/inasistente").send({ notas_consulta: "No vino" }),
    );
    snap("inasistente-D-repetido", await request(app).patch("/api/turnos/4/inasistente").send({}));
    snap("cancelar-D-desde-inasistente", await request(app).patch("/api/turnos/4/cancelar").send({}));
  });

  test("PATCH /:id/reprogramado (200, 409 solapamiento, 409 restricción, 400 estado)", async () => {
    snap(
      "crear-E",
      await request(app)
        .post("/api/turnos")
        .send({ id_paciente: 1, fecha_hora_inicio: MIE_10, precio_final: 300 }),
    );
    snap(
      "reprogramar-D-solapa-E",
      await request(app)
        .patch("/api/turnos/4/reprogramado")
        .send({ fecha_hora_inicio: MIE_10, fecha_hora_fin: MIE_11 }),
    );
    snap(
      "reprogramar-D-domingo",
      await request(app)
        .patch("/api/turnos/4/reprogramado")
        .send({ fecha_hora_inicio: DOM_10, fecha_hora_fin: DOM_11 }),
    );
    snap(
      "reprogramar-D-ok",
      await request(app)
        .patch("/api/turnos/4/reprogramado")
        .send({ fecha_hora_inicio: MAR_11, fecha_hora_fin: "2030-01-08T12:00:00-03:00" }),
    );
    snap(
      "reprogramar-A-atendido",
      await request(app)
        .patch("/api/turnos/1/reprogramado")
        .send({ fecha_hora_inicio: MAR_10, fecha_hora_fin: MAR_11 }),
    );
    snap(
      "reprogramar-D-ignorando-restricciones",
      await request(app)
        .patch("/api/turnos/4/reprogramado")
        .send({
          fecha_hora_inicio: DOM_10,
          fecha_hora_fin: DOM_11,
          ignorarRestricciones: true,
        }),
    );
  });

  test("Cobros sobre turnos: formateo de SolicitudCobro en los listados", async () => {
    snap(
      "pago-parcial-A",
      await request(app)
        .post("/api/cobros/registrar-pago")
        .send({ turno_id: 1, monto: 400, metodo_pago: "Transferencia" }),
    );
    snap("atendidos-despues-del-cobro", await request(app).get("/api/turnos/atendidos"));
    snap("lista-con-cobro", await request(app).get("/api/turnos?estadoFiltrado=atendido"));
    snap("por-paciente-con-cobro", await request(app).get("/api/turnos/paciente/1"));
  });

  test("PATCH /:id/delete (toggle activo) y 404", async () => {
    snap("delete-B", await request(app).patch("/api/turnos/2/delete"));
    snap("lista-sin-B", await request(app).get("/api/turnos?mes=2030-01&limit=50"));
    snap("delete-B-toggle-de-vuelta", await request(app).patch("/api/turnos/2/delete"));
    snap("delete-404", await request(app).patch("/api/turnos/9999/delete"));
  });

  test("Estado final de la BD (efectos secundarios)", async () => {
    await snapDb("db-turnos", Turno, { order: [["id_turno", "ASC"]] });
    await snapDb("db-historial", HistorialEstadoTurno, {
      order: [["id_turno", "ASC"], ["id_estado", "ASC"], ["descripcion", "ASC"]],
      attributes: { exclude: ["id_historial"] },
    });
    await snapDb("db-practicas-turno", PracticaTurno, {
      order: [["id_turno", "ASC"], ["id_practica", "ASC"]],
      attributes: { exclude: ["id_practica_turno"] },
    });
  });
});
