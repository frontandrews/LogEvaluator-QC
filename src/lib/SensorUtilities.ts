import { SENSOR, SensorDefinition, LogContents } from "./SensorTypes";
import {
  evaluateThermometer,
  evaluateReadingsAgainstThreshold,
} from "./SensorEvaluator";

/**
 * SENSORS is a constant object that defines the behavior and attributes of different sensor types.
 * Each sensor type has:
 * 1. An evaluator function that determines how readings for that sensor should be assessed against a reference value.
 * 2. A referenceKey which specifies which key in a reference data object should be used when evaluating the sensor's readings.
 */
export const SENSORS: { [key in SENSOR]: SensorDefinition } = {
  [SENSOR.THERMOMETER]: {
    evaluator: (readings, reference) =>
      evaluateThermometer(readings, reference),
    referenceKey: "temperature",
  },
  [SENSOR.HUMIDITY]: {
    evaluator: (readings, reference) =>
      evaluateReadingsAgainstThreshold(readings, reference, 1),
    referenceKey: "humidity",
  },
  [SENSOR.MONOXIDE]: {
    evaluator: (readings, reference) =>
      evaluateReadingsAgainstThreshold(readings, reference, 3),
    referenceKey: "monoxide",
  },
};

export const SENSOR_TYPES = Object.values(SENSOR);

/**
 * Determines if a given type string corresponds to a valid SENSOR type.
 * @param type - The string to validate against SENSOR types.
 * @returns true if the string is a SENSOR type, false otherwise.
 */
export const isSensorType = (type: string): type is SENSOR => {
  return SENSOR_TYPES.includes(type as SENSOR);
};

/**
 * Validates the given sensor type and checks if the log file contains its reference value.
 * Throws an error for unrecognized sensor types or missing reference values.
 * @param sensorType - The type of the sensor to validate.
 * @param logFile - The parsed log contents.
 */
export function validateSensorTypeAndReference(
  sensorType: SENSOR,
  logFile: LogContents
): void {
  // Ensure sensorType is recognized
  if (!SENSORS[sensorType]) {
    throw new Error(`Unrecognized sensor type: '${sensorType}'`);
  }

  // Ensure we have a reference for the sensorType
  const referenceKey = SENSORS[sensorType].referenceKey;
  if (!referenceKey) {
    throw new Error(`Reference key not found for sensor type: '${sensorType}'`);
  }

  // Ensure we have a reference value for the sensorType
  const referenceValue = logFile.reference[referenceKey];
  if (referenceValue === undefined) {
    throw new Error(
      `Reference value not found for sensor type: '${sensorType}'`
    );
  }
}
