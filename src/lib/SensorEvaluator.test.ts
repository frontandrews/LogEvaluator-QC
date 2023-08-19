import {
  evaluateLogFile,
  evaluateReadingsAgainstThreshold,
  computeStandardDeviation,
  evaluateThermometer,
} from "./SensorEvaluator";
import { FILE_TYPES, LogContents, SENSOR } from "./SensorTypes";

describe("Sensor Evaluator", () => {
  describe("evaluateLogFile", () => {
    it("should evaluate JSON logs correctly", () => {
      const logData: LogContents = {
        reference: { temperature: 70.0, humidity: 45.0, monoxide: 6 },
        sensors: [
          {
            type: SENSOR.THERMOMETER,
            name: "temp-1",
            readings: [
              { timestamp: "2023-05-12T12:00", value: 72.5 },
              { timestamp: "2023-05-12T12:01", value: 71.0 },
            ],
          },
        ],
      };
      const expected = {
        "temp-1": "precise",
      };
      expect(evaluateLogFile(logData, FILE_TYPES.JSON)).toEqual(expected);
    });

    it("should evaluate text logs correctly", () => {
      const logData = `
                reference 70.0 45.0 6
                thermometer temp-1
                2023-05-12T12:00 72.5
                2023-05-12T12:01 71.0
            `;
      const expected = {
        "temp-1": "precise",
      };
      expect(evaluateLogFile(logData, FILE_TYPES.TXT)).toEqual(expected);
    });

    it("should throw an error for unsupported file types", () => {
      const logData = "random data";
      expect(() => evaluateLogFile(logData, "xml" as FILE_TYPES)).toThrow(
        "Unsupported file type"
      );
    });

    it("should throw an error for invalid JSON format", () => {
      const logData = "{ key: 'value' }"; // This is not a valid JSON string
      expect(() => evaluateLogFile(logData, FILE_TYPES.JSON)).toThrow(
        "Invalid JSON format"
      );
    });

    it("should throw an error for invalid text format", () => {
      const logData = "random data";
      expect(() => evaluateLogFile(logData, FILE_TYPES.TXT)).toThrow(
        "Invalid text format"
      );
    });
  });

  describe("evaluateReadingsAgainstThreshold", () => {
    it("should return 'discard' if any reading exceeds the threshold from the reference", () => {
      expect(evaluateReadingsAgainstThreshold([5, 10, 15], 10, 2)).toBe(
        "discard"
      );
    });

    it("should return 'keep' if all readings are within the threshold from the reference", () => {
      expect(evaluateReadingsAgainstThreshold([8, 10, 12], 10, 2)).toBe("keep");
    });
  });

  describe("computeStandardDeviation", () => {
    it("should compute the standard deviation correctly", () => {
      expect(computeStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(
        2,
        3
      );
    });
  });

  describe("evaluateThermometer", () => {
    it("should return 'ultra precise' for readings within 0.5 of the reference and std deviation < 3", () => {
      expect(evaluateThermometer([69.8, 70.1, 70.0, 70.2], 70.0)).toBe(
        "ultra precise"
      );
    });

    it("should return 'very precise' for readings within 0.5 of the reference and 3 <= std deviation < 5", () => {
      expect(evaluateThermometer([65.0, 70.0, 70.0, 75.0], 70.0)).toBe(
        "very precise"
      );
    });

    it("should return 'precise' for readings where magnitude > 0.5 or standard deviation is between 3 and 5", () => {
      expect(
        evaluateThermometer(
          [
            72.4, 76.0, 79.1, 75.6, 71.2, 71.4, 69.2, 65.2, 62.8, 61.4, 64.0,
            67.5, 69.4,
          ],
          70.0
        )
      ).toBe("precise");
    });
  });
});
