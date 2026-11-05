import Foundation

@main struct DecoderChecks {
    struct Response: Decodable { let generatedAt: Date }
    static func main() throws {
        for timestamp in ["2026-11-03T12:00:00.123Z", "2026-11-03T12:00:00Z"] {
            let data = Data("{\"generatedAt\":\"\(timestamp)\"}".utf8)
            let response = try NudgeResponseDecoder.decode(Response.self, from: data)
            precondition(response.generatedAt.timeIntervalSince1970 > 1_700_000_000)
        }
        do {
            _ = try NudgeResponseDecoder.decode(Response.self, from: Data("{\"generatedAt\":\"invalid\"}".utf8))
            fatalError("Invalid timestamps must not be accepted")
        } catch is DecodingError { }
        print("PASS: fractional and whole-second server dates; invalid date rejected")
    }
}
