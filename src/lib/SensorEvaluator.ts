import { EvaluationResult, LogContents, FileTypes } from "./SensorTypes";
import { validateSensorTypeAndReference, SENSORS } from "./SensorUtilities";
import {
  isValidJsonFormat,
  isValidTextFormat,
  parseLogText,
} from "./LogParser";

/**
 * Evaluates the provided log file contents to determine the status of each sensor.
 * @param logFile - The file data (could be raw text or structured data).
 * @param fileType - The type of the file (either 'json' or 'txt').
 * @returns An EvaluationResult object with sensor names as keys and their evaluation status as values.
 */
export function evaluateLogFile(
  logFile: string | LogContents,
  fileType: FileTypes
): EvaluationResult {
  const result: EvaluationResult = {};

  let parsedLogFile: LogContents;

  if (fileType === "json") {
    if (typeof logFile === "string") {
      let jsonData;
      try {
        jsonData = JSON.parse(logFile);
      } catch (e) {
        throw new Error("Invalid JSON format");
      }
      if (!isValidJsonFormat(jsonData)) {
        throw new Error("Invalid JSON format");
      }
      parsedLogFile = jsonData;
    } else {
      // If the data is already in object format, just validate
      if (!isValidJsonFormat(logFile)) {
        throw new Error("Invalid JSON format");
      }
      parsedLogFile = logFile;
    }
  } else if (fileType === "txt") {
    if (typeof logFile !== "string" || !isValidTextFormat(logFile)) {
      throw new Error("Invalid text format");
    }
    parsedLogFile = parseLogText(logFile);
  } else {
    throw new Error("Unsupported file type");
  }

  for (const sensor of parsedLogFile.sensors) {
    const sensorType = sensor.type;
    const sensorName = sensor.name;
    const sensorReadings = sensor.readings.map((r) => r.value);

    validateSensorTypeAndReference(sensorType, parsedLogFile);

    const sensorDefinition = SENSORS[sensorType];
    if (sensorDefinition) {
      const evaluator = sensorDefinition.evaluator;
      result[sensorName] = evaluator(
        sensorReadings,
        parsedLogFile.reference[sensorDefinition.referenceKey]
      );
    }
  }

  return result;
}

/**
 * Evaluates sensor readings against a given threshold and reference value.
 * @param readings - An array of sensor readings.
 * @param reference - The reference value for the sensor.
 * @param threshold - The threshold for evaluation.
 * @returns "discard" if any reading exceeds the threshold from the reference, otherwise "keep".
 */
export function evaluateReadingsAgainstThreshold(
  readings: number[],
  reference: number,
  threshold: number
): string {
  for (const reading of readings) {
    const magnitude = Math.abs(reading - reference);
    if (magnitude > threshold) return "discard";
  }
  return "keep";
}

/**
 * Computes the standard deviation for an array of numbers.
 * @param readings - An array of numbers.
 * @returns The standard deviation of the numbers.
 */
export function computeStandardDeviation(readings: number[]): number {
  const average =
    readings.reduce((sum, reading) => sum + reading, 0) / readings.length;
  const variance =
    readings.reduce((sum, reading) => sum + Math.pow(reading - average, 2), 0) /
    readings.length;
  return Math.sqrt(variance);
}

/**
 * Evaluates thermometer readings based on average, standard deviation, and the provided reference.
 * @param readings - An array of thermometer readings.
 * @param reference - The reference temperature value.
 * @returns The precision classification for the thermometer: "ultra precise", "very precise", or "precise".
 */
export function evaluateThermometer(
  readings: number[],
  reference: number
): string {
  const average =
    readings.reduce((sum, reading) => sum + reading, 0) / readings.length;
  const standardDeviation = computeStandardDeviation(readings);
  const magnitude = Math.abs(average - reference);

  if (magnitude <= 0.5) {
    if (standardDeviation >= 3 && standardDeviation < 5) return "very precise";
    if (standardDeviation < 3) return "ultra precise";
  }

  return "precise";
}
