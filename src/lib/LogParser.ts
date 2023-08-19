import { LogContents, Reference, SENSOR, Sensor } from "./SensorTypes";
import { isSensorType } from "./SensorUtilities";

/**
 * Parses a raw log text into structured log contents.
 * @param input - The raw log text.
 * @returns An object containing the parsed reference values and sensor data.
 */
export function parseLogText(input: string): LogContents {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  let currentLine = 0;

  // Parse reference values
  const reference = parseReference(lines[currentLine]);
  currentLine++;

  // Parse sensor readings
  const sensors = [];
  while (currentLine < lines.length) {
    const sensorTypeLine = lines[currentLine];
    if (isSensorType(sensorTypeLine.split(" ")[0])) {
      const sensorData = [];
      currentLine++;
      while (
        currentLine < lines.length &&
        lines[currentLine].startsWith("20")
      ) {
        sensorData.push(lines[currentLine]);
        currentLine++;
      }
      const sensor = parseSensor(sensorTypeLine, sensorData);
      if (sensor) {
        sensors.push(sensor);
      }
    } else {
      currentLine++; // Skip invalid lines
    }
  }

  return {
    reference,
    sensors,
  };
}

/**
 * Parses the reference lines from the log to extract temperature, humidity, and monoxide values.
 * @param lines - The array of log text lines.
 * @returns An object with parsed temperature, humidity, and monoxide reference values.
 */
export function parseReference(line: string): Reference {
  const parts = line.split(" ");

  if (parts.length !== 4 || parts[0] !== "reference") {
    throw new Error("Invalid reference format.");
  }

  const temperature = parseFloat(parts[1]);
  const humidity = parseFloat(parts[2]);
  const monoxide = parseFloat(parts[3]);

  if (isNaN(temperature) || isNaN(humidity) || isNaN(monoxide)) {
    throw new Error("Invalid reference data. Expected numeric values.");
  }

  return { temperature, humidity, monoxide };
}

/**
 * Check it the timestamp is valid
 * @param timestamp
 * @returns boolean
 */
export function isValidTimestamp(timestamp: string): boolean {
  const regex =
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timestamp);
}

/**
 * Parses the sensor readings from the log text.
 * @param lines - The array of log text lines.
 * @returns An array of Sensor objects containing their types, names, and readings.
 */
export function parseSensor(
  sensorTypeLine: string,
  sensorData: string[]
): Sensor | null {
  const parts = sensorTypeLine.split(" ");
  const sensorType = parts[0] as SENSOR;
  const sensorName = parts[1].replace("\r", "");
  const readings = [];

  for (const readingLine of sensorData) {
    const readingParts = readingLine.split(" ");
    if (readingParts.length === 2) {
      const timestamp = readingParts[0];
      const value = parseFloat(readingParts[1]);
      if (!isNaN(value) && isValidTimestamp(timestamp)) {
        readings.push({ timestamp, value });
      }
    }
  }

  if (readings.length === 0) {
    return null;
  }

  return {
    type: sensorType,
    name: sensorName,
    readings,
  };
}

/**
 * Checks if the provided data has valid JSON format.
 * @param {LogContents} data - The data to validate.
 * @returns {boolean} - Returns true if the data format is valid, otherwise false.
 */
export function isValidJsonFormat(data: LogContents): boolean {
  if (!data?.reference) return false;

  const validProps: (keyof Reference)[] = [
    "temperature",
    "humidity",
    "monoxide",
  ];
  return validProps.every((prop) => typeof data.reference[prop] === "number");
}

/**
 * Validates if the given text conforms to the expected sensor log format.
 * The text is expected to have a 'reference' line, followed by sensor headers and their readings.
 * Sensor readings should have a timestamp and a value, separated by space.
 *
 * @param {string} text - The text content to validate.
 * @returns {boolean} - Returns true if the text format is valid, otherwise false.
 */
export function isValidTextFormat(text: string) {
  const cleanedText = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
  const lines = cleanedText
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  let currentLine = 0;

  const isReferenceLine = (line: string): boolean => {
    return /^reference (\d+(\.\d+)?\s*){3}$/.test(line);
  };

  const isSensorHeader = (line: string): boolean => {
    return /^(thermometer|humidity|monoxide) \w+-\d+$/.test(line);
  };

  const isSensorReading = (line: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2} \d{1,2}(\.\d+)?$/.test(line);
  };

  // Validate reference line
  if (!isReferenceLine(lines[currentLine])) {
    console.log("Failed at reference line:", lines[currentLine]);
    return false;
  }

  currentLine++; // Increment currentLine after validating the reference line

  while (currentLine < lines.length) {
    // Validate sensor header
    if (!isSensorHeader(lines[currentLine])) {
      console.log("Failed at sensor header:", lines[currentLine]);
      return false;
    }

    currentLine++; // Move to the next line after header

    // Validate sensor readings until we find another header or reach the end
    while (currentLine < lines.length && isSensorReading(lines[currentLine])) {
      currentLine++; // If it's a valid reading, move to the next line
    }
  }

  // Ensure that all lines have been validated
  if (currentLine !== lines.length) {
    console.log("Did not validate all lines. Last line:", lines[currentLine]);
    return false;
  }

  return true;
}
