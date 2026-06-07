# Thiết kế: format-json-llm

**Ngày:** 2026-06-07
**Mục tiêu:** Module JS + UI để convert qua lại giữa JSON và TOON, và suy ra schema (JSON Schema chuẩn + TOON schema nén) nhằm gửi cho LLM hiểu định dạng request/response JSON.

## Bối cảnh

TOON (Token-Oriented Object Notation) là định dạng tuần tự hóa nén, tiết kiệm token hơn JSON khi đưa dữ liệu có cấu trúc vào prompt LLM. Công cụ này giúp:
- Convert hai chiều JSON ↔ TOON.
- Sinh schema (JSON Schema 2020-12 + TOON schema nén) từ dữ liệu mẫu để mô tả format cho LLM.
- So sánh token JSON vs TOON để thấy mức tiết kiệm.

## Quyết định đã chốt

- **Schema:** sinh cả hai — JSON Schema chuẩn (2020-12) và TOON schema nén.
- **Chiều convert:** hai chiều JSON ↔ TOON.
- **Stack UI:** Vite + Vanilla JS.
- **Engine TOON:** dùng thư viện `@toon-format/toon` (v2.3.0, MIT, zero-dep).

## API thư viện `@toon-format/toon`

```ts
encode(input: unknown, options?: EncodeOptions): string   // JSON -> TOON
decode(input: string, options?: DecodeOptions): JsonValue  // TOON -> JSON
// ToonDecodeError dùng để bắt lỗi decode

EncodeOptions: { indent?, delimiter?: ','|'\t'|'|', keyFolding?: 'off'|'safe', flattenDepth?, replacer? }
DecodeOptions: { indent?, strict?: boolean (default true), expandPaths?: 'off'|'safe' }
```

Thư viện **không** có hàm suy luận schema → tự viết module schema.

## Kiến trúc

Tách rõ **core (thuần logic, zero-DOM)** và **UI (DOM/event)** để core test độc lập và tái dùng (có thể publish npm sau).

```
format-json-llm/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── core/                  # thuần logic, zero-DOM
│   │   ├── toon.js            # wrap encode/decode + bắt lỗi (ToonDecodeError)
│   │   ├── schema-json.js     # suy ra JSON Schema 2020-12 từ dữ liệu mẫu
│   │   ├── schema-toon.js     # suy ra TOON schema nén
│   │   ├── tokens.js          # đếm/ước lượng token, so sánh JSON vs TOON
│   │   └── index.js           # API gộp: jsonToToon, toonToJson, toJsonSchema, toToonSchema
│   ├── ui/
│   │   ├── app.js             # khởi tạo, nối event, điều phối
│   │   ├── panels.js          # editor 2 cột + ô output
│   │   └── controls.js        # delimiter, indent, strict, copy, swap
│   └── main.js                # entry: import core + ui
└── tests/                     # Vitest cho core
```

## API core (`src/core/index.js`)

```js
jsonToToon(jsonString, opts) -> { ok, toon, error }
toonToJson(toonString, opts) -> { ok, json, error }   // json = chuỗi đã format
toJsonSchema(value)          -> object (JSON Schema 2020-12)
toToonSchema(value)          -> string  (chữ ký kiểu nén)
```

Tất cả trả về dạng kết quả có `ok/error`, không ném lỗi ra UI.

## Suy luận Schema

### JSON Schema (2020-12)
Đệ quy từ dữ liệu mẫu:
- `type` theo kiểu giá trị; `null` → union kiểu.
- Object: `properties`, `required` = các key xuất hiện ở **mọi** phần tử (với mảng object) hoặc mọi key có mặt (với object đơn).
- Array: `items` gộp kiểu các phần tử (nếu đồng nhất → 1 schema; nếu khác → union).

### TOON Schema (nén)
Rút gọn còn chữ ký kiểu, ví dụ:
```
users[]{id:int,name:str,active:bool,tags:str[]}
```
Mục tiêu: ít token nhất để mô tả format cho LLM. Kiểu rút gọn: `int`, `num`, `str`, `bool`, `null`, `obj`, `[]`.

## Luồng dữ liệu & UI

Giao diện 2 panel + thanh điều khiển:
- **Panel trái (Input):** dán JSON hoặc TOON; chọn chế độ nguồn.
- **Nút giữa:** `JSON → TOON`, `TOON → JSON` (swap), `→ Schema`.
- **Panel phải (Output):** kết quả; tab phụ xem JSON Schema và TOON Schema.
- **Thanh dưới:** so sánh token (JSON vs TOON) + % tiết kiệm; nút Copy từng ô.
- **Tùy chọn:** delimiter (comma/tab/pipe), indent, `strict`, `keyFolding`.
- **Realtime:** convert khi gõ (debounce ~300ms); báo lỗi parse rõ ràng.

### Token
Dùng `gpt-tokenizer` (thuần JS, nhẹ) để đếm token chính xác; fallback ước lượng (ký tự/4) nếu không có.

### Prompt builder (tùy chọn, nhẹ)
Nút ghép schema + câu hướng dẫn ngắn để dán thẳng vào LLM. Tính năng phụ, không bắt buộc cho bản đầu.

## Xử lý lỗi
- Bắt `ToonDecodeError` và lỗi `JSON.parse` → hiện thông báo thân thiện ở panel, không crash UI.

## Test (Vitest, cho core)
- Round-trip JSON→TOON→JSON bất biến.
- Suy luận schema: object lồng, mảng object, `null`, kiểu hỗn hợp.
- Các delimiter khác nhau (comma/tab/pipe).
- Đếm token: JSON vs TOON cho mẫu chuẩn.

## Ngoài phạm vi (YAGNI)
- Không tài khoản/đăng nhập, không backend.
- Không lưu lịch sử bền vững (có thể localStorage sau).
- Không hỗ trợ stream decode trong bản đầu.
