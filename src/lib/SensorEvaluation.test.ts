import fs from "fs";
import path from "path";
import {
  evaluateLogFile,
  evaluateThermometer,
  parseLogText,
  isValidTimestamp,
  computeStandardDeviation,
  evaluateReadingsAgainstThreshold,
  isSensorType,
  validateSensorTypeAndReference,
  LogContents,
  SENSOR,
} from "./SensorEvaluation";

describe("evaluateLogFile", () => {
  test("should correctly evaluate a sample log", () => {
    const sampleLog = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../log-files/log.json"), "utf8")
    );

    const result = evaluateLogFile(sampleLog, "json");
    expect(result["temp-1"]).toBe("precise");
    expect(result["temp-2"]).toBe("ultra precise");
    expect(result["hum-1"]).toBe("keep");
    expect(result["mon-1"]).toBe("keep");
    expect(result["hum-2"]).toBe("discard");
    expect(result["mon-2"]).toBe("discard");
  });
});

describe("evaluateThermometer", () => {
  test("should return ultra precise if conditions are met", () => {
    const readings = [70, 70.2, 70.1];
    const result = evaluateThermometer(readings, 70);
    expect(result).toBe("ultra precise");
  });
});

describe("parseLogText", () => {
  test("should correctly parse log text into structured log contents", () => {
    const logText = `
            reference 70 45 6
            thermometer temp-1
            2007-04-05T22:01 72.4
            2007-04-05T22:01 72.4
        `;

    const result = parseLogText(logText);

    expect(result.reference.temperature).toBe(70);
    expect(result.sensors[0].name).toBe("temp-1");
    expect(result.sensors[0].readings[0].timestamp).toBe("2007-04-05T22:01");
    expect(result.sensors[0].readings[0].value).toBe(72.4);
  });
});

describe("isValidTimestamp", () => {
  test("should return true for valid timestamps", () => {
    expect(isValidTimestamp("2007-04-05T22:05")).toBeTruthy();
  });

  test("should return false for invalid timestamps", () => {
    expect(isValidTimestamp("2007/04/05 22:05")).toBeFalsy();
    expect(isValidTimestamp("22:05")).toBeFalsy();
  });
});

describe("computeStandardDeviation", () => {
  test("should return 0 for single value readings", () => {
    expect(computeStandardDeviation([5])).toBe(0);
  });

  test("should correctly compute the standard deviation for multiple readings", () => {
    expect(computeStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(
      2,
      2
    );
  });
});

describe("evaluateReadingsAgainstThreshold", () => {
  test("should return discard if a reading exceeds threshold from reference", () => {
    expect(evaluateReadingsAgainstThreshold([4, 5, 6], 5, 0.5)).toBe("discard");
  });

  test("should return keep if all readings are within threshold from reference", () => {
    expect(evaluateReadingsAgainstThreshold([4.5, 5, 5.5], 5, 0.5)).toBe(
      "keep"
    );
  });
});

describe("isSensorType", () => {
  test("should return true for valid SENSOR types", () => {
    expect(isSensorType("thermometer")).toBeTruthy();
  });

  test("should return false for invalid SENSOR types", () => {
    expect(isSensorType("invalidType")).toBeFalsy();
  });
});

describe("validateSensorTypeAndReference", () => {
  const validLog: LogContents = {
    reference: {
      temperature: 70,
      humidity: 45,
      monoxide: 6,
    },
    sensors: [],
  };

  test("should not throw an error for valid sensor type and existing reference", () => {
    expect(() =>
      validateSensorTypeAndReference(SENSOR.THERMOMETER, validLog)
    ).not.toThrow();
  });

  test("should throw an error for unrecognized sensor type", () => {
    expect(() =>
      validateSensorTypeAndReference("invalidType" as SENSOR, validLog)
    ).toThrow("Unrecognized sensor type");
  });

  test("should throw an error for missing reference", () => {
    const invalidLog: LogContents = {
      reference: {
        temperature: 70,
        humidity: 45,
        // @ts-expect-error testing missing monoxide
        monoxide: undefined,
      },
      sensors: [],
    };
    expect(() =>
      validateSensorTypeAndReference(SENSOR.MONOXIDE, invalidLog)
    ).toThrow("Reference value not found");
  });
});

describe("Performance Tests", () => {
  test("evaluateReadingsAgainstThreshold performance", () => {
    const largeReadings = Array(20000000)
      .fill(0)
      .map(() => Math.random() * 100);

    const startTime = performance.now();

    evaluateReadingsAgainstThreshold(largeReadings, 50, 0.5);

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`evaluateReadingsAgainstThreshold took ${duration}ms`);

    expect(duration).toBeLessThan(100);
  });
});

function generateLargeLogJson(numEntries = 1000000) {
  const log = {
    reference: {
      temperature: 70,
      humidity: 45,
      monoxide: 6,
    },
    sensors: [],
  } as LogContents;

  for (let i = 0; i < numEntries; i++) {
    log.sensors.push({
      name: `temp-${i}`,
      type: SENSOR.THERMOMETER,
      readings: [
        {
          timestamp: `2007-04-05T22:${(i % 60).toString().padStart(2, "0")}`,
          value: 70 + Math.random() * 5 - 2.5,
        },
      ],
    });
  }

  return log;
}

describe("Performance Tests - Long File", () => {
  test("evaluateLogFile performance with a large sample in JSON", () => {
    const largeSampleLog = generateLargeLogJson();

    const startTime = performance.now();

    evaluateLogFile(largeSampleLog, "json");

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`evaluateLogFile took ${duration}ms with a large sample`);

    expect(duration).toBeLessThan(2000);
  });
});
