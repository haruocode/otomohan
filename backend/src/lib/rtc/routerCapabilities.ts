type RtpCodecKind = "audio" | "video";

type RtcpFeedback = {
  type: string;
  parameter?: string;
};

type RtpCodecCapability = {
  kind: RtpCodecKind;
  mimeType: string;
  clockRate: number;
  channels?: number;
  parameters?: Record<string, number | string>;
  rtcpFeedback?: RtcpFeedback[];
};

type RtpHeaderExtension = {
  kind: RtpCodecKind;
  uri: string;
  preferredId: number;
  preferredEncrypt: boolean;
  direction: "sendrecv" | "sendonly" | "recvonly" | "inactive";
};

export type RouterRtpCapabilities = {
  codecs: RtpCodecCapability[];
  headerExtensions: RtpHeaderExtension[];
};

const DEFAULT_ROUTER_RTP_CAPABILITIES: RouterRtpCapabilities = {
  codecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48_000,
      channels: 2,
      parameters: {
        useinbandfec: 1,
        stereo: 1,
      },
      rtcpFeedback: [{ type: "transport-cc" }],
    },
  ],
  headerExtensions: [
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
      preferredId: 1,
      preferredEncrypt: false,
      direction: "sendrecv",
    },
    {
      kind: "audio",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
      preferredId: 2,
      preferredEncrypt: false,
      direction: "sendrecv",
    },
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id",
      preferredId: 3,
      preferredEncrypt: false,
      direction: "sendrecv",
    },
  ],
};

export function getRouterRtpCapabilities(): RouterRtpCapabilities {
  return DEFAULT_ROUTER_RTP_CAPABILITIES;
}
