// ═══════════════════════════════════════════════════════════════
//   نظام صالات الأفراح — ESP32 Firmware (v11 BULK)
//   ⭐ قراءة واحدة فقط من Firebase + كتابة واحدة فقط
//   ⭐ الـ loop حر 100% — التحكم الفيزيائي يشتغل فوراً
//   الريليه الثنائي (15,4): LOW=ON  HIGH=OFF
//   الريليه الرباعي (2,21,22,5): HIGH=ON LOW=OFF
//   Firebase: "true" = تشغيل  "false" = إطفاء (لكل الريليهات)
// ═══════════════════════════════════════════════════════════════

#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <DFRobotDFPlayerMini.h>

#define WIFI_SSID "Redmi 13C"
#define WIFI_PASS "12345678"
#define FB_URL "https://wedding-hall-24f25-default-rtdb.firebaseio.com/wedding_hall"
#define FB_AUTH "5mDVL0J3XlozgbnfW4O7XsI9wbVzdefbfMxoo5kr"

#define PIN_BUTTON  27
#define PIN_IR      12
#define TRIG_DOOR   25
#define ECHO_DOOR   26
#define SERVO_PIN   14
#define TRIG_SEAT   32
#define ECHO_SEAT   33
#define SERVO_GATE  13

#define FB_INTERVAL   300   // 300ms — قراءة واحدة فقط
#define GATE_TIMEOUT  10000
#define DOOR_TIMEOUT  20000

Servo myServo;
Servo gateServo;
DFRobotDFPlayerMini myDFPlayer;
bool mp3Ready = false;
bool mp3Playing = false;

bool gateOpen = false;
unsigned long gateOpenTime = 0;
unsigned long lastPress = 0;

bool doorOpen = false;
unsigned long doorOpenTime = 0;

bool seatingDone = false;
unsigned long seatingTime = 0;

bool irConnected = false;
bool irDone = false;
unsigned long irStart = 0;
int irH = 0, irL = 0;
int irStep = 0;

bool wifiOk = false;
unsigned long fbT = 0;

bool mp3Started = false;
unsigned long mp3Start = 0;

bool fbInitDone = false;

// ⭐ متغيرات — آخر حالة تم قراءتها من Firebase
bool fb_gateOpen = false;
bool fb_doorOpen = false;
bool fb_seatActive = false;
bool fb_mp3Playing = false;
bool fb_lights[6] = {false, false, false, false, false, false}; // street,ship,ceiling,floor,po,pi
int fb_mp3Track = 0;

// ═══════════════════════════════════════════════════
//   الريليهات — lightOn/lightOff تعالج نوع الريليه
// ═══════════════════════════════════════════════════

void lightOn(int pin) {
  if (pin == 15 || pin == 4) digitalWrite(pin, LOW);   // ثنائي: LOW=ON
  else digitalWrite(pin, HIGH);                          // رباعي: HIGH=ON
}

void lightOff(int pin) {
  if (pin == 15 || pin == 4) digitalWrite(pin, HIGH);   // ثنائي: HIGH=OFF
  else digitalWrite(pin, LOW);                           // رباعي: LOW=OFF
}

bool isOn(int pin) {
  if (pin == 15 || pin == 4) return digitalRead(pin) == LOW;
  return digitalRead(pin) == HIGH;
}

// ═══════════════════════════════════════════════════
//   ⭐ Firebase — قراءة واحدة لكل شي
//   يقرأ /wedding_hall كامل في طلب HTTP واحد فقط!
// ═══════════════════════════════════════════════════

String fbReadAll() {
  HTTPClient h;
  h.begin(String(FB_URL) + ".json?auth=" + FB_AUTH);
  int c = h.GET();
  String result = "";
  if (c == 200) result = h.getString();
  h.end();
  return result;
}

// ⭐ استخراج قيمة bool من JSON string
// يبحث عن "lights":{"street":VALUE أو "street": VALUE
bool extractBool(String json, String parent, String key) {
  // يبحث عن "parent":{"key": true/false أو "parent": {"key": true/false
  String s1 = "\"" + parent + "\":{\"" + key + "\":";
  String s2 = "\"" + parent + "\": {\"" + key + "\":";
  String s3 = "\"" + parent + "\": { \"" + key + "\":";
  String s4 = "\"" + parent + "\":{ \"" + key + "\":";

  int idx = -1;
  idx = json.indexOf(s1);
  if (idx < 0) idx = json.indexOf(s2);
  if (idx < 0) idx = json.indexOf(s3);
  if (idx < 0) idx = json.indexOf(s4);
  if (idx < 0) return false;

  idx = json.indexOf(":", idx);
  if (idx < 0) return false;
  idx++;

  // تخطي المسافات
  while (idx < json.length() && json[idx] == ' ') idx++;

  if (json.substring(idx).startsWith("true")) return true;
  return false;
}

// ⭐ استخراج قيمة int من JSON string
int extractInt(String json, String parent, String key) {
  String s1 = "\"" + parent + "\":{\"" + key + "\":";
  String s2 = "\"" + parent + "\": {\"" + key + "\":";
  String s3 = "\"" + parent + "\": { \"" + key + "\":";
  String s4 = "\"" + parent + "\":{ \"" + key + "\":";

  int idx = -1;
  idx = json.indexOf(s1);
  if (idx < 0) idx = json.indexOf(s2);
  if (idx < 0) idx = json.indexOf(s3);
  if (idx < 0) idx = json.indexOf(s4);
  if (idx < 0) return -1;

  idx = json.indexOf(":", idx);
  if (idx < 0) return -1;
  idx++;

  while (idx < json.length() && json[idx] == ' ') idx++;

  String num = "";
  while (idx < json.length() && (json[idx] >= '0' && json[idx] <= '9')) {
    num += json[idx];
    idx++;
  }
  if (num.length() == 0) return -1;
  return num.toInt();
}

// ═══════════════════════════════════════════════════
//   ⭐ Firebase — كتابة واحدة لكل شي
//   يكتب كل الحالة في طلب HTTP PATCH واحد فقط!
// ═══════════════════════════════════════════════════

void fbWriteBulk() {
  String json = "{";

  // lights
  json += "\"lights\":{";
  json += "\"street\":\"" + String(isOn(15) ? "true" : "false") + "\",";
  json += "\"ship\":\"" + String(isOn(4) ? "true" : "false") + "\",";
  json += "\"ceiling\":\"" + String(isOn(2) ? "true" : "false") + "\",";
  json += "\"floor\":\"" + String(isOn(21) ? "true" : "false") + "\",";
  json += "\"pillar_outer\":\"" + String(isOn(22) ? "true" : "false") + "\",";
  json += "\"pillar_inner\":\"" + String(isOn(5) ? "true" : "false") + "\"";
  json += "},";

  // gate
  json += "\"gate\":{\"open\":\"" + String(gateOpen ? "true" : "false") + "\"},";

  // door
  json += "\"door\":{\"open\":\"" + String(doorOpen ? "true" : "false") + "\"},";

  // seat
  json += "\"seat\":{\"active\":\"" + String(seatingDone ? "true" : "false") + "\"},";

  // mp3
  json += "\"mp3\":{\"playing\":\"" + String(mp3Playing ? "true" : "false") + "\"},";

  // status
  json += "\"status\":{\"online\":\"true\",\"lastSeen\":" + String(millis() / 1000);

  json += "}}";

  HTTPClient h;
  h.begin(String(FB_URL) + ".json?auth=" + FB_AUTH);
  h.addHeader("Content-Type", "application/json");
  h.PATCH(json);
  h.end();
}

// ═══════════════════════════════════════════════════
//   Firebase Init — أول مرة بعد الاتصال — طلب واحد
// ═══════════════════════════════════════════════════

void fbInit() {
  // أول مرة — كتابة حالة مبدئية كلها في طلب واحد
  String json = "{";
  json += "\"lights\":{";
  json += "\"street\":\"false\",\"ship\":\"false\",\"ceiling\":\"false\",";
  json += "\"floor\":\"false\",\"pillar_outer\":\"false\",\"pillar_inner\":\"false\"";
  json += "},";
  json += "\"gate\":{\"open\":\"false\"},";
  json += "\"door\":{\"open\":\"false\"},";
  json += "\"seat\":{\"active\":\"false\"},";
  json += "\"mp3\":{\"playing\":\"false\",\"track\":0},";
  json += "\"status\":{\"online\":\"true\",\"lastSeen\":" + String(millis() / 1000);
  json += "}}";

  HTTPClient h;
  h.begin(String(FB_URL) + ".json?auth=" + FB_AUTH);
  h.addHeader("Content-Type", "application/json");
  h.PUT(json);
  h.end();

  fbInitDone = true;
  Serial.println("[FB] INIT OK — كل شي مقفل");
}

// ═══════════════════════════════════════════════════
//   حساسات
// ═══════════════════════════════════════════════════

long readUS(uint8_t trig, uint8_t echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long dur = pulseIn(echo, HIGH, 30000);
  if (dur == 0) return -1;
  long dist = dur * 0.034 / 2;
  if (dist <= 0 || dist > 400) return -1;
  return dist;
}

// ═══════════════════════════════════════════════════
//   ⭐ معالجة أوامر Firebase — من قراءة واحدة
//   يقارن بين Firebase والمحلي — يطبّق التغييرات فقط
// ═══════════════════════════════════════════════════

void processFirebase(String json) {
  if (json.length() < 10) return; // بيانات فاشلة

  // ⭐ قراءة كل القيم من JSON واحد
  bool new_gate = extractBool(json, "gate", "open");
  bool new_door = extractBool(json, "door", "open");
  bool new_seat = extractBool(json, "seat", "active");
  bool new_mp3 = extractBool(json, "mp3", "playing");
  int new_track = extractInt(json, "mp3", "track");

  bool new_lights[6];
  new_lights[0] = extractBool(json, "lights", "street");
  new_lights[1] = extractBool(json, "lights", "ship");
  new_lights[2] = extractBool(json, "lights", "ceiling");
  new_lights[3] = extractBool(json, "lights", "floor");
  new_lights[4] = extractBool(json, "lights", "pillar_outer");
  new_lights[5] = extractBool(json, "lights", "pillar_inner");

  // ⭐ معالجة البوابة — فقط لو تغيرت
  if (new_gate != fb_gateOpen) {
    fb_gateOpen = new_gate;
    if (new_gate && !gateOpen) {
      gateServo.write(90);
      lightOn(15);
      gateOpen = true;
      gateOpenTime = millis();
      Serial.println("[FB] بوابة فتح");
    } else if (!new_gate && gateOpen) {
      gateServo.write(0);
      lightOff(15);
      gateOpen = false;
      Serial.println("[FB] بوابة إغلاق");
    }
  }

  // ⭐ معالجة الباب
  if (new_door != fb_doorOpen) {
    fb_doorOpen = new_door;
    if (new_door && !doorOpen) {
      Serial.println("[FB] باب فتح");
      myServo.write(90);
      lightOn(15);
      lightOff(2);
      lightOn(21);
      lightOn(22);
      lightOff(5);
      if (mp3Ready && !mp3Playing) {
        myDFPlayer.play(1);
        mp3Playing = true;
      }
      doorOpen = true;
      doorOpenTime = millis();
    } else if (!new_door && doorOpen) {
      Serial.println("[FB] باب إغلاق");
      myServo.write(0);
      doorOpen = false;
    }
  }

  // ⭐ معالجة الجلوس
  if (new_seat != fb_seatActive) {
    fb_seatActive = new_seat;
    if (new_seat && !seatingDone) {
      Serial.println("[FB] جلوس تفعيل");
      lightOn(4);
      lightOff(15);
      lightOn(2);
      lightOff(21);
      lightOn(22);
      lightOn(5);
      seatingDone = true;
      seatingTime = millis();
    } else if (!new_seat && seatingDone) {
      Serial.println("[FB] جلوس إعادة تعيين");
      lightOff(4);
      lightOff(15);
      lightOn(2);
      lightOn(21);
      lightOn(22);
      lightOn(5);
      seatingDone = false;
    }
  }

  // ⭐ معالجة MP3
  if (new_mp3 != fb_mp3Playing) {
    fb_mp3Playing = new_mp3;
    if (mp3Ready) {
      if (new_mp3 && !mp3Playing) {
        int track = new_track;
        if (track < 1) track = 1;
        myDFPlayer.play(track);
        mp3Playing = true;
        Serial.print("[FB] MP3 مسار ");
        Serial.println(track);
      } else if (!new_mp3 && mp3Playing) {
        myDFPlayer.stop();
        mp3Playing = false;
        Serial.println("[FB] MP3 إيقاف");
      }
    }
  }

  // ⭐ معالجة الأضواء — فقط اللي تغيرت
  int pins[6] = {15, 4, 2, 21, 22, 5};
  for (int i = 0; i < 6; i++) {
    if (new_lights[i] != fb_lights[i]) {
      fb_lights[i] = new_lights[i];
      // ⭐ Firebase "true" = تشغيل — لكل الريليهات
      if (new_lights[i]) lightOn(pins[i]);
      else lightOff(pins[i]);
    }
  }

  // حفظ track number
  if (new_track >= 0) fb_mp3Track = new_track;
}

// ═══════════════════════════════════════════════════
//   Setup — بدون أي تأخير
// ═══════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  Serial.println("=== Wedding Hall ESP32 v11 BULK ===");

  // الريليهات — كلها مقفلة
  int rp[] = {4, 15, 2, 21, 22, 5};
  for (int i = 0; i < 6; i++) pinMode(rp[i], OUTPUT);
  digitalWrite(15, HIGH);  // ثنائي: HIGH=OFF
  digitalWrite(4, HIGH);   // ثنائي: HIGH=OFF
  digitalWrite(2, LOW);    // رباعي: LOW=OFF
  digitalWrite(21, LOW);   // رباعي: LOW=OFF
  digitalWrite(22, LOW);   // رباعي: LOW=OFF
  digitalWrite(5, LOW);    // رباعي: LOW=OFF

  // السيرفوهات
  pinMode(SERVO_PIN, OUTPUT);
  pinMode(SERVO_GATE, OUTPUT);
  myServo.attach(SERVO_PIN);
  myServo.write(0);
  gateServo.attach(SERVO_GATE);
  gateServo.write(0);

  // الحساسات
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_IR, INPUT);
  pinMode(TRIG_DOOR, OUTPUT);
  pinMode(ECHO_DOOR, INPUT);
  pinMode(TRIG_SEAT, OUTPUT);
  pinMode(ECHO_SEAT, INPUT);
  digitalWrite(TRIG_DOOR, LOW);
  digitalWrite(TRIG_SEAT, LOW);

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  // IR
  irStart = millis();
  irStep = 0;

  // MP3
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  mp3Start = millis();
  mp3Started = false;

  Serial.println("=== READY ===");
}

// ═══════════════════════════════════════════════════
//   Loop — ⭐ الـ loop حر — التحكم الفيزيائي فوري
// ═══════════════════════════════════════════════════

void loop() {

  // ═══ MP3 — يبدأ بعد 500ms ═══
  if (!mp3Started && millis() - mp3Start >= 500) {
    if (myDFPlayer.begin(Serial2)) {
      myDFPlayer.volume(20);
      mp3Ready = true;
      Serial.println("[MP3] DFPlayer متصل");
    } else {
      Serial.println("[MP3] DFPlayer غير متصل");
    }
    mp3Started = true;
  }

  // ═══ IR — فحص ═══
  if (!irDone && millis() - irStart >= 1000 && irStep < 20) {
    if (digitalRead(PIN_IR) == HIGH) irH++;
    else irL++;
    irStep++;
    if (irStep >= 20) {
      irConnected = abs(irH - irL) >= 15;
      irDone = true;
      Serial.println(irConnected ? "[IR] متصل" : "[IR] غير متصل");
    }
  }

  // ═══ WiFi ═══
  if (!wifiOk && WiFi.status() == WL_CONNECTED) {
    wifiOk = true;
    Serial.println(" WiFi OK");
    Serial.print(" IP: ");
    Serial.println(WiFi.localIP());
  }

  // ═══ Firebase Init ═══
  if (wifiOk && !fbInitDone) {
    fbInit();
  }

  // ═══ ⭐ Firebase — طلب واحد كل 300ms ═══
  if (wifiOk && millis() - fbT >= FB_INTERVAL) {
    // ⭐ قراءة واحدة فقط — يقرأ كل شي في طلب HTTP واحد
    String json = fbReadAll();
    if (json.length() > 10) {
      processFirebase(json);
    }

    // ⭐ كتابة واحدة فقط — يكتب كل شي في طلب HTTP واحد
    fbWriteBulk();

    fbT = millis();
  }

  // ═══ ⭐ بوابة الشارع — زر فيزيائي + IR — فوري 100% ═══
  bool buttonPressed = (digitalRead(PIN_BUTTON) == LOW);
  bool irDetected = irDone && irConnected && (digitalRead(PIN_IR) == LOW);

  if ((buttonPressed || irDetected) && millis() - lastPress > 500) {
    lastPress = millis();
    if (!gateOpen) {
      gateServo.write(90);
      lightOn(15);
      gateOpen = true;
      fb_gateOpen = true;
      gateOpenTime = millis();
      Serial.println("[محلي] بوابة فتح");
    } else {
      gateServo.write(0);
      lightOff(15);
      gateOpen = false;
      fb_gateOpen = false;
      Serial.println("[محلي] بوابة إغلاق");
    }
  }

  // ═══ ⭐ إغلاق تلقائي للبوابة — فوري ═══
  if (gateOpen && millis() - gateOpenTime >= GATE_TIMEOUT) {
    gateServo.write(0);
    lightOff(15);
    gateOpen = false;
    fb_gateOpen = false;
    Serial.println("[محلي] بوابة إغلاق تلقائي");
  }

  // ═══ ⭐ حساس الخارجي — فوري ═══
  if (!doorOpen) {
    long dist = readUS(TRIG_DOOR, ECHO_DOOR);
    if (dist > 0 && dist <= 8) {
      Serial.println("[محلي] باب — شخص!");
      myServo.write(90);
      lightOn(15);
      lightOff(2);
      lightOn(21);
      lightOn(22);
      lightOff(5);
      if (mp3Ready && !mp3Playing) {
        myDFPlayer.play(1);
        mp3Playing = true;
        Serial.println("[MP3] تشغيل");
      }
      doorOpen = true;
      fb_doorOpen = true;
      doorOpenTime = millis();
    }
  } else {
    if (millis() - doorOpenTime >= DOOR_TIMEOUT) {
      myServo.write(0);
      doorOpen = false;
      fb_doorOpen = false;
      Serial.println("[محلي] باب إغلاق تلقائي");
    }
  }

  // ═══ ⭐ حساس الداخلي — فوري ═══
  if (!seatingDone) {
    long dist = readUS(TRIG_SEAT, ECHO_SEAT);
    if (dist > 0 && dist <= 10) {
      Serial.println("[محلي] جلوس — العريس قرب!");
      lightOn(4);
      lightOff(15);
      lightOn(2);
      lightOff(21);
      lightOn(22);
      lightOn(5);
      seatingDone = true;
      fb_seatActive = true;
      seatingTime = millis();
    }
  }
}
