import { parseLogText, parseReference, parseSensor, isValidTimestamp, isValidJsonFormat, isValidTextFormat } from "./LogParser";

describe("Sensor Log Parser", () => {

    it("should parse valid reference data correctly", () => {
        const line = "reference 70.0 45.0 6";
        const expected = { temperature: 70.0, humidity: 45.0, monoxide: 6 };
        expect(parseReference(line)).toEqual(expected);
    });

    it("should throw error for invalid reference data", () => {
        const line = "reference 70.0 x 6";
        expect(() => parseReference(line)).toThrow("Invalid reference data. Expected numeric values.");
    });

    it("should validate timestamp correctly", () => {
        expect(isValidTimestamp("2007-04-05T22:04")).toBeTruthy();
        expect(isValidTimestamp("2007D44F05T22404")).toBeFalsy();
    });

    it("should validate JSON format correctly", () => {
        const data = {
            reference: { temperature: 70.0, humidity: 45.0, monoxide: 6 },
            sensors: []
        };
        expect(isValidJsonFormat(data)).toBeTruthy();
    });

    it("should invalidate JSON with missing reference values", () => {
        const data = {
            reference: { temperature: 70.0, monoxide: 6 },
            sensors: []
        };
        // @ts-expect-error: Testing invalid data
        expect(isValidJsonFormat(data)).toBeFalsy();
    });

    it("should validate valid text format correctly", () => {
        const text = `
            reference 70.0 45.0 6
            thermometer temp-1
            2007-04-05T22:00 72.4
            2007-04-05T22:01 76.0
            thermometer temp-2
            2007-04-05T22:01 69.5
            humidity hum-1
            2007-04-05T22:06 45.1
            humidity hum-2
            2007-04-05T22:04 44.4
            monoxide mon-1
            2007-04-05T22:06 9
            monoxide mon-2
            2007-04-05T22:07 8
            2007-04-05T22:08 6
        `;
        expect(isValidTextFormat(text)).toBeTruthy();
    });

    it("should invalidate text with incorrect format", () => {
        const text = `
            reference 70 45 6
            the2rmometer temp-1
            2007-04-05T22:01 72.4
            2007-04-05T22:01 72.4
        `;
        expect(isValidTextFormat(text)).toBeFalsy();
    });

    it("should parse log text correctly", () => {
        const input = `
            reference 70.0 45.0 6
            thermometer temp-1
            2023-05-12T12:00 22.5
        `;
        const result = parseLogText(input);
        expect(result.reference).toEqual({ temperature: 70.0, humidity: 45.0, monoxide: 6 });
        expect(result.sensors[0].type).toBe("thermometer");
        expect(result.sensors[0].name).toBe("temp-1");
        expect(result.sensors[0].readings[0].timestamp).toBe("2023-05-12T12:00");
        expect(result.sensors[0].readings[0].value).toBe(22.5);
    });
});

describe("parseReference", () => {
    it("should throw error for reference line with more than four parts", () => {
        const line = "reference 70.0 45.0 6 extra";
        expect(() => parseReference(line)).toThrow("Invalid reference format.");
    });

    it("should throw error for reference line with less than four parts", () => {
        const line = "reference 70.0 45.0";
        expect(() => parseReference(line)).toThrow("Invalid reference format.");
    });

    it("should throw error for line without the 'reference' keyword", () => {
        const line = "70.0 45.0 6";
        expect(() => parseReference(line)).toThrow("Invalid reference format.");
    });
});

describe("isValidTimestamp", () => {
    it("should invalidate timestamp with incorrect time format", () => {
        expect(isValidTimestamp("2007-04-05T25:00")).toBeFalsy();
    });

    it("should invalidate timestamp with incorrect month/day format", () => {
        expect(isValidTimestamp("2007-13-05T22:04")).toBeFalsy();
    });
});

describe("isValidJsonFormat", () => {
    it("should invalidate JSON without a reference property", () => {
        const data = {
            sensors: []
        };
        // @ts-expect-error: Testing invalid data
        expect(isValidJsonFormat(data)).toBeFalsy();
    });

    it("should invalidate reference properties with non-numeric values", () => {
        const data = {
            reference: { temperature: "70.0", humidity: 45.0, monoxide: 6 },
            sensors: []
        };
        // @ts-expect-error: Testing invalid data
        expect(isValidJsonFormat(data)).toBeFalsy();
    });
});

describe("isValidTextFormat", () => {
    it("should invalidate text without a reference line", () => {
        const text = `
            thermometer temp-1
            2007-04-05T22:01 72.4
        `;
        expect(isValidTextFormat(text)).toBeFalsy();
    });

    it("should invalidate sensor readings with more than two parts", () => {
        const text = `
            reference 70.0 45.0 6
            thermometer temp-1
            2007-04-05T22:01 72.4 extra
        `;
        expect(isValidTextFormat(text)).toBeFalsy();
    });

    it("should invalidate sensor type headers without a sensor name", () => {
        const text = `
            reference 70.0 45.0 6
            thermometer
            2007-04-05T22:01 72.4
        `;
        expect(isValidTextFormat(text)).toBeFalsy();
    });
});

describe("parseSensor", () => {
    it("should handle sensor readings with invalid timestamps", () => {
        const sensorTypeLine = "thermometer temp-1";
        const sensorData = ["2007-04-05T25:01 72.4"];
        const result = parseSensor(sensorTypeLine, sensorData);
        expect(result).toBeNull();
    });

    it("should handle sensor readings with non-numeric values", () => {
        const sensorTypeLine = "thermometer temp-1";
        const sensorData = ["2007-04-05T22:01 abc"];
        const result = parseSensor(sensorTypeLine, sensorData);
        expect(result).toBeNull();
    });
});

describe("parseLogText", () => {
    it("should handle logs with missing sensor readings after a header", () => {
        const input = `
            reference 70.0 45.0 6
            thermometer temp-1
            thermometer temp-2
        `;
        const result = parseLogText(input);
        expect(result.sensors.length).toBe(0);
    });

    it("should handle logs with invalid lines", () => {
        const input = `
            reference 70.0 45.0 6
            invalid data line
            thermometer temp-1
            2023-05-12T12:00 22.5
        `;
        const result = parseLogText(input);
        expect(result.sensors[0].readings.length).toBe(1);
    });
});
