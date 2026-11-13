/** @format */

import "./helpers.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import app from "../../index.js";
import sequelize from "../../config/database.js";

/**
 * SNAPSHOT DE RUTAS
 * Lista `MÉTODO /ruta -> [handlers]` de TODA la API. Si el refactor agrega,
 * quita, reordena o renombra una ruta o un middleware, este test falla.
 */

const dir = path.dirname(fileURLToPath(import.meta.url));
const indexRoutesSrc = fs.readFileSync(
  path.join(dir, "../../routes/index.routes.js"),
  "utf8",
);
const prefijos = [...indexRoutesSrc.matchAll(/router\.use\(\s*"([^"]+)"/g)].map(
  (m) => m[1],
);

const nombre = (fn) => fn?.name || "(anon)";

const recolectar = (stack, prefijo, salida) => {
  for (const layer of stack) {
    if (layer.route) {
      const metodos = Object.keys(layer.route.methods)
        .filter((m) => layer.route.methods[m])
        .map((m) => m.toUpperCase())
        .join(",");
      const ruta = (prefijo + layer.route.path).replace(/\/$/, "") || "/";
      salida.push(
        `${metodos} ${ruta} -> [${layer.route.stack.map((l) => nombre(l.handle)).join(", ")}]`,
      );
    } else if (layer.handle?.stack) {
      const candidatos = prefijos.filter((p) =>
        layer.matchers?.some((match) => match(p)),
      );
      const p = candidatos.sort((a, b) => b.length - a.length)[0] ?? "<?>";
      recolectar(layer.handle.stack, prefijo + p, salida);
    } else {
      salida.push(`USE ${prefijo || "/"} -> ${nombre(layer.handle)}`);
    }
  }
};

describe("Snapshot de rutas de la API", () => {
  afterAll(() => sequelize.close());

  test("inventario completo de endpoints", () => {
    const salida = [];
    recolectar(app.router.stack, "", salida);
    expect(salida.length).toBeGreaterThan(50);
    expect(salida.join("\n")).toMatchSnapshot();
  });
});

