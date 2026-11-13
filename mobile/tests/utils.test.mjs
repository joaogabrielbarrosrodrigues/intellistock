import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, isValidIsoDate, matchesSearch, parseDecimalInput } from "../src/utils.ts";

test("busca nomes com ou sem acentos e sem diferenciar maiúsculas", () => {
  assert.equal(matchesSearch("Café torrado", "cafe"), true);
  assert.equal(matchesSearch("Cafe torrado", "CAFÉ"), true);
  assert.equal(matchesSearch("Açúcar", "acuc"), true);
  assert.equal(matchesSearch("Café", "chá"), false);
  assert.equal(matchesSearch("Café", "  "), true);
});

test("aceita decimais em português e respeita a precisão de cada campo", () => {
  assert.equal(parseDecimalInput(" 12,345 ", 3), 12.345);
  assert.equal(parseDecimalInput("12.34", 2), 12.34);
  assert.equal(parseDecimalInput("", 2), 0);
  assert.equal(parseDecimalInput("-1", 2), -1);
  assert.equal(parseDecimalInput("10", 0), 10);
});

test("recusa formatos que Number aceita indevidamente nos formulários", () => {
  for (const value of ["1e3", "0xFF", "Infinity", "12,345", "1.234,56", "1,2,3", "texto"]) {
    assert.ok(Number.isNaN(parseDecimalInput(value, 2)), value);
  }
  assert.ok(Number.isNaN(parseDecimalInput("1.001", 0)));
});

test("não exibe uma data impossível como se fosse uma data do mês seguinte", () => {
  assert.equal(isValidIsoDate("2026-02-30"), false);
  assert.equal(formatDate("2026-02-30"), "-");
  assert.equal(formatDate("2028-02-29"), "29/02/2028");
  assert.equal(formatDate("2026-11-06"), "06/11/2026");
});
