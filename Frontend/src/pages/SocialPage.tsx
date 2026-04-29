import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CloudUploadOutlined,
  LeftOutlined,
  PaperClipOutlined,
  PhoneOutlined,
  SearchOutlined,
  SendOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { io, type Socket } from "socket.io-client";
import type { ArgsProps } from "antd/es/message/interface";
import Header from "../components/Header";
import { RiWechatLine } from "react-icons/ri";

const { Text } = Typography;

interface SocialUser {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  idUser: string;
  idStudent?: string;
  idTeacher?: string;
  className?: string;
  isOnline: boolean;
  lastSeenAt?: string;
  lastInteractedAt?: string;
  avatarUrl: string;
}

interface MessageAttachment {
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  resourceType: string;
  size: number;
}

interface SocialMessage {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    avatarUrl?: string;
    role: string;
    idUser: string;
  };
  receiver: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    avatarUrl?: string;
    role: string;
    idUser: string;
  };
  text?: string;
  attachments: MessageAttachment[];
  delivered: boolean;
  deliveredAt?: string;
  seen: boolean;
  seenAt?: string;
  recalled: boolean;
  recalledAt?: string;
  createdAt: string;
}

interface MessageStatusPayload {
  fromUserId: string;
  status: "delivered" | "read";
  messageIds: string[];
}

type CallType = "audio" | "video";
type CallStatus = "ringing" | "connecting" | "connected";

interface CallerProfile {
  _id: string;
  fullName: string;
  avatarUrl?: string;
}

interface IncomingCallState {
  fromUserId: string;
  callType: CallType;
  caller: CallerProfile;
}

interface ActiveCallState {
  peerId: string;
  peerName: string;
  peerAvatar?: string;
  callType: CallType;
  direction: "incoming" | "outgoing";
  status: CallStatus;
}

const roleLabel: Record<string, string> = {
  admin: "Quản trị viên",
  teacher: "Giáo viên",
  student: "Học sinh",
  user: "Cờ đỏ",
};

const formatLastSeen = (isOnline: boolean, lastSeenAt?: string) => {
  if (isOnline) return "Đang online";
  if (!lastSeenAt) return "Offline";

  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa truy cập";
  if (diffMin < 60) return `Online ${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Online ${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  return `Online ${diffDay} ngày trước`;
};

const formatTime = (date: string) => {
  const d = new Date(date);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getMyMessageStatusLabel = (message: SocialMessage) => {
  if (message.recalled) return "Đã thu hồi";
  if (message.seen) return "Đã đọc";
  if (message.delivered) return "Đã nhận";
  return "Đã gửi";
};

const getUndoMessageKey = (messageId: string) => `social-recall-undo-${messageId}`;
const UNDO_RECALL_DURATION_SECONDS = 5;
const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

const buildFullName = (firstName?: string, lastName?: string) =>
  `${lastName || ""} ${firstName || ""}`.trim();

const sortUsersByRecency = (input: SocialUser[]) => {
  const toTime = (value?: string) => (value ? new Date(value).getTime() : 0);

  return [...input].sort((a, b) => {
    const diff = toTime(b.lastInteractedAt) - toTime(a.lastInteractedAt);
    if (diff !== 0) return diff;
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return a.fullName.localeCompare(b.fullName);
  });
};

type SocialPageMode = "admin" | "user";

interface SocialPageProps {
  mode?: SocialPageMode;
}

const SocialPage = ({ mode = "admin" }: SocialPageProps) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<SocialUser | null>(null);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [textMessage, setTextMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [myId, setMyId] = useState<string>("");
  const [undoCountdownMap, setUndoCountdownMap] = useState<Record<string, number>>({});
  const [incomingCall, setIncomingCall] = useState<IncomingCallState | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const undoCountdownTimersRef = useRef<Record<string, number>>({});
  const selectedUserIdRef = useRef<string>("");
  const myIdRef = useRef<string>("");
  const selfProfileRef = useRef<CallerProfile | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const ringtoneContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);
  const activeCallRef = useRef<ActiveCallState | null>(null);
  const incomingCallRef = useRef<IncomingCallState | null>(null);
  const isMobileChatView = isMobile && Boolean(selectedUser);

  const syncPeerFromMessage = (payload: SocialMessage) => {
    const peer = payload.sender._id === myIdRef.current ? payload.receiver : payload.sender;
    if (!peer?._id) return;

    const mergedAvatar = peer.avatarUrl || peer.avatar;
    const messageTime = payload.createdAt;

    setUsers((prev) => {
      const index = prev.findIndex((user) => user._id === peer._id);
      if (index < 0) return prev;

      const current = prev[index];
      const updatedUser: SocialUser = {
        ...current,
        firstName: peer.firstName,
        lastName: peer.lastName,
        fullName: buildFullName(peer.firstName, peer.lastName) || current.fullName,
        email: peer.email,
        role: peer.role,
        idUser: peer.idUser,
        avatarUrl: mergedAvatar || current.avatarUrl,
        lastInteractedAt: messageTime || current.lastInteractedAt,
      };

      const noVisualChange =
        current.firstName === updatedUser.firstName &&
        current.lastName === updatedUser.lastName &&
        current.fullName === updatedUser.fullName &&
        current.email === updatedUser.email &&
        current.role === updatedUser.role &&
        current.idUser === updatedUser.idUser &&
        current.avatarUrl === updatedUser.avatarUrl &&
        current.lastInteractedAt === updatedUser.lastInteractedAt;

      if (noVisualChange) return prev;

      const next = [...prev];
      next[index] = updatedUser;
      return sortUsersByRecency(next);
    });

    setSelectedUser((prev) => {
      if (!prev || prev._id !== peer._id) return prev;

      return {
        ...prev,
        firstName: peer.firstName,
        lastName: peer.lastName,
        fullName: buildFullName(peer.firstName, peer.lastName) || prev.fullName,
        email: peer.email,
        role: peer.role,
        idUser: peer.idUser,
        avatarUrl: mergedAvatar || prev.avatarUrl,
      };
    });
  };

  const updateMessageInState = (payload: SocialMessage) => {
    setMessages((prev) => prev.map((msg) => (msg._id === payload._id ? payload : msg)));
  };

  const closeUndoRecallNotice = (messageId: string) => {
    messageApi.destroy(getUndoMessageKey(messageId));

    const timerId = undoCountdownTimersRef.current[messageId];
    if (timerId) {
      window.clearInterval(timerId);
      delete undoCountdownTimersRef.current[messageId];
    }

    setUndoCountdownMap((prev) => {
      if (prev[messageId] === undefined) return prev;
      const next = { ...prev };
      delete next[messageId];
      return next;
    });
  };

  const showUndoRecallNotice = (messageId: string) => {
    const existTimer = undoCountdownTimersRef.current[messageId];
    if (existTimer) {
      window.clearInterval(existTimer);
      delete undoCountdownTimersRef.current[messageId];
    }

    setUndoCountdownMap((prev) => ({
      ...prev,
      [messageId]: UNDO_RECALL_DURATION_SECONDS,
    }));

    const timerId = window.setInterval(() => {
      setUndoCountdownMap((prev) => {
        const current = prev[messageId];
        if (current === undefined) return prev;

        const nextValue = Math.max(0, current - 1);
        const next = { ...prev, [messageId]: nextValue };

        if (nextValue <= 0) {
          const currentTimer = undoCountdownTimersRef.current[messageId];
          if (currentTimer) {
            window.clearInterval(currentTimer);
            delete undoCountdownTimersRef.current[messageId];
          }
        }

        return next;
      });
    }, 1000);
    undoCountdownTimersRef.current[messageId] = timerId;

    const key = getUndoMessageKey(messageId);
    const countdown = undoCountdownMap[messageId] ?? UNDO_RECALL_DURATION_SECONDS;

    const config: ArgsProps = {
      key,
      duration: UNDO_RECALL_DURATION_SECONDS,
      content: (
        <div className="flex items-center gap-2">
          <span>Tin nhắn đã được thu hồi</span>
          <Button
            size="small"
            type="link"
            className="!h-auto !p-0"
            onClick={() => {
              void undoRecallMessage(messageId);
            }}
          >
            Hoàn tác ({countdown})
          </Button>
        </div>
      ),
    };

    messageApi.open(config);
  };

  const token = useMemo(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return "";

    try {
      const parsed = JSON.parse(raw);
      setMyId(parsed._id || "");
      selfProfileRef.current = {
        _id: parsed._id || "",
        fullName: buildFullName(parsed.firstName, parsed.lastName) || parsed.email || "Người dùng",
        avatarUrl: parsed.avatarUrl || parsed.avatar,
      };
      return parsed.token || "";
    } catch {
      return "";
    }
  }, []);

  const activeOrganizationId = useMemo(() => {
    const raw = localStorage.getItem("activeOrganization");
    if (!raw) return "";

    try {
      return JSON.parse(raw)?.organizationId || "";
    } catch {
      return "";
    }
  }, []);

  const attachStreamToVideo = async (
    elementRef: { current: HTMLVideoElement | null },
    stream: MediaStream | null,
  ) => {
    if (!elementRef.current) return;
    elementRef.current.srcObject = stream;

    if (stream) {
      try {
        await elementRef.current.play();
      } catch {
        // Ignore autoplay failures; browser may require an additional user gesture.
      }
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      window.clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  };

  const playRingtonePulse = () => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!ringtoneContextRef.current) {
      ringtoneContextRef.current = new AudioCtx();
    }

    const ctx = ringtoneContextRef.current;
    if (!ctx) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    const scheduleTone = (offset: number, duration: number, frequency: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, now + offset);

      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.2, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + duration);
    };

    // Double-beep ringtone style.
    scheduleTone(0, 0.18, 780);
    scheduleTone(0.24, 0.2, 860);
  };

  const startRingtone = () => {
    stopRingtone();
    playRingtonePulse();
    ringtoneIntervalRef.current = window.setInterval(() => {
      playRingtonePulse();
    }, 1400);
  };

  const attachCurrentStreamsToVideos = () => {
    void attachStreamToVideo(localVideoRef, localStreamRef.current);
    void attachStreamToVideo(remoteVideoRef, remoteStreamRef.current);
  };

  const cleanupCallResources = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    stopRingtone();
    void attachStreamToVideo(localVideoRef, null);
    void attachStreamToVideo(remoteVideoRef, null);
  };

  const createPeerConnection = (peerId: string) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current) return;
      socketRef.current.emit("social:call-ice-candidate", {
        toUserId: peerId,
        candidate: event.candidate.toJSON(),
      });
    };

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      remoteStreamRef.current = stream;
      void attachStreamToVideo(remoteVideoRef, stream);
      setActiveCall((prev) => (prev ? { ...prev, status: "connected" } : prev));
      stopRingtone();
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      if (state === "connected") {
        setActiveCall((prev) => (prev ? { ...prev, status: "connected" } : prev));
        stopRingtone();
      }

      if (state === "failed" || state === "closed" || state === "disconnected") {
        setActiveCall(null);
        cleanupCallResources();
      }
    };

    return peerConnection;
  };

  const getMediaConstraints = (callType: CallType): MediaStreamConstraints => ({
    audio: true,
    video: callType === "video",
  });

  const getOrCreateLocalStream = async (callType: CallType) => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(callType));
    localStreamRef.current = stream;
    void attachStreamToVideo(localVideoRef, stream);
    return stream;
  };

  const addLocalTracksToPeer = (peerConnection: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  };

  const finishCall = (shouldNotifyPeer: boolean) => {
    if (shouldNotifyPeer && activeCall && socketRef.current) {
      socketRef.current.emit("social:call-ended", {
        toUserId: activeCall.peerId,
      });
    }

    setIncomingCall(null);
    setActiveCall(null);
    cleanupCallResources();
  };

  const startCall = async (callType: CallType) => {
    if (!socketRef.current || !selectedUser) return;
    if (activeCall || incomingCall) {
      messageApi.warning("Bạn đang có cuộc gọi khác");
      return;
    }

    try {
      await getOrCreateLocalStream(callType);

      setActiveCall({
        peerId: selectedUser._id,
        peerName: selectedUser.fullName,
        peerAvatar: selectedUser.avatarUrl,
        callType,
        direction: "outgoing",
        status: "ringing",
      });

      startRingtone();

      socketRef.current.emit("social:call-request", {
        toUserId: selectedUser._id,
        callType,
        caller: selfProfileRef.current,
      });
    } catch (error) {
      console.error(error);
      cleanupCallResources();
      messageApi.error("Không truy cập được micro/camera để thực hiện cuộc gọi");
    }
  };

  const rejectIncomingCall = () => {
    if (!socketRef.current || !incomingCall) return;

    socketRef.current.emit("social:call-rejected", {
      toUserId: incomingCall.fromUserId,
      reason: "declined",
    });

    setIncomingCall(null);
    stopRingtone();
  };

  const acceptIncomingCall = async () => {
    if (!socketRef.current || !incomingCall) return;

    try {
      const localStream = await getOrCreateLocalStream(incomingCall.callType);
      const peerConnection = createPeerConnection(incomingCall.fromUserId);
      addLocalTracksToPeer(peerConnection, localStream);

      setActiveCall({
        peerId: incomingCall.fromUserId,
        peerName: incomingCall.caller.fullName,
        peerAvatar: incomingCall.caller.avatarUrl,
        callType: incomingCall.callType,
        direction: "incoming",
        status: "connecting",
      });

      stopRingtone();

      socketRef.current.emit("social:call-accepted", {
        toUserId: incomingCall.fromUserId,
        callType: incomingCall.callType,
      });

      setIncomingCall(null);
    } catch (error) {
      console.error(error);
      cleanupCallResources();
      messageApi.error("Không truy cập được micro/camera để nhận cuộc gọi");
    }
  };

  const cancelOutgoingCall = () => {
    if (!socketRef.current || !activeCall) return;

    if (activeCall.direction === "outgoing" && activeCall.status === "ringing") {
      socketRef.current.emit("social:call-cancelled", {
        toUserId: activeCall.peerId,
      });
    } else {
      socketRef.current.emit("social:call-ended", {
        toUserId: activeCall.peerId,
      });
    }

    finishCall(false);
  };

  const fetchUsers = async (q = "") => {
    if (!token) return;

    setLoadingUsers(true);
    try {
      const url = new URL(`${import.meta.env.VITE_SERVER_URL}/social/users`);
      if (q.trim()) {
        url.searchParams.set("q", q.trim());
      }

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Không tải được danh sách người dùng");
      }

      const data: SocialUser[] = await res.json();
      setUsers(sortUsersByRecency(data));

      if (!isMobile && !selectedUser && data.length > 0) {
        setSelectedUser(data[0]);
      }
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi tải danh sách người dùng");
    } finally {
      setLoadingUsers(false);
    }
  };

  const recallMessage = async (messageId: string) => {
    if (!token) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/social/messages/${messageId}/recall`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Thu hồi tin nhắn thất bại");
      }

      const payload: SocialMessage = await res.json();
      updateMessageInState(payload);
      showUndoRecallNotice(messageId);
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể thu hồi tin nhắn");
    }
  };

  const undoRecallMessage = async (messageId: string) => {
    if (!token) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/social/messages/${messageId}/undo-recall`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Hoàn tác thu hồi thất bại");
      }

      const payload: SocialMessage = await res.json();
      updateMessageInState(payload);
      closeUndoRecallNotice(messageId);
      messageApi.success("Đã hoàn tác thu hồi tin nhắn");
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể hoàn tác thu hồi");
    }
  };

  const fetchMessages = async (peerId: string) => {
    if (!token || !peerId) return;

    setLoadingMessages(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/social/messages/${peerId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Không tải được tin nhắn");
      }

      const data: SocialMessage[] = await res.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi tải lịch sử tin nhắn");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!isMobile && !selectedUser && users.length > 0) {
      setSelectedUser(users[0]);
    }
  }, [isMobile, selectedUser, users]);

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUser?._id || "";
  }, [selectedUser?._id]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!selectedUser) return;
    fetchMessages(selectedUser._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id, token]);

  useEffect(() => {
    const messageIds = Object.keys(undoCountdownMap);
    if (messageIds.length === 0) return;

    messageIds.forEach((messageId) => {
      const key = getUndoMessageKey(messageId);
      const countdown = undoCountdownMap[messageId];

      const config: ArgsProps = {
        key,
        duration: countdown,
        content: (
          <div className="flex items-center gap-2">
            <span>Tin nhắn đã được thu hồi</span>
            <Button
              size="small"
              type="link"
              className="!h-auto !p-0"
              onClick={() => {
                void undoRecallMessage(messageId);
              }}
            >
              Hoàn tác ({countdown})
            </Button>
          </div>
        ),
      };

      messageApi.open(config);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoCountdownMap]);

  useEffect(() => {
    if (!token || !activeOrganizationId) return;

    const socket = io(import.meta.env.VITE_SERVER_URL, {
      transports: ["websocket"],
      auth: {
        token,
        organizationId: activeOrganizationId,
      },
    });

    socket.on("social:message-recalled", (payload: SocialMessage) => {
      updateMessageInState(payload);

      if (payload.sender._id === myId) {
        showUndoRecallNotice(payload._id);
      }
    });

    socketRef.current = socket;

    socket.on("social:message", (payload: SocialMessage) => {
      syncPeerFromMessage(payload);

      const selectedUserId = selectedUserIdRef.current;

      const isCurrentConversation =
        payload.sender._id === selectedUserId || payload.receiver._id === selectedUserId;

      if (isCurrentConversation) {
        setMessages((prev) => {
          const existed = prev.some((msg) => msg._id === payload._id);
          if (existed) return prev;
          return [...prev, payload];
        });
      }
    });

    socket.on("social:presence", (payload: { userId: string; isOnline: boolean; lastSeenAt: string }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user._id === payload.userId
            ? {
                ...user,
                isOnline: payload.isOnline,
                lastSeenAt: payload.lastSeenAt,
              }
            : user,
        ),
      );
    });

    socket.on("social:message-status", (payload: MessageStatusPayload) => {
      setMessages((prev) =>
        prev.map((messageItem) => {
          if (!payload.messageIds.includes(messageItem._id)) {
            return messageItem;
          }

          if (payload.status === "read") {
            return {
              ...messageItem,
              delivered: true,
              seen: true,
            };
          }

          if (payload.status === "delivered") {
            return {
              ...messageItem,
              delivered: true,
            };
          }

          return messageItem;
        }),
      );
    });

    socket.on("social:message-unrecalled", (payload: SocialMessage) => {
      updateMessageInState(payload);
      closeUndoRecallNotice(payload._id);
    });

    socket.on(
      "social:call-request",
      (payload: { fromUserId: string; callType: CallType; caller: CallerProfile }) => {
        if (!payload?.fromUserId || !payload?.callType || !payload?.caller) return;

        if (activeCallRef.current || incomingCallRef.current) {
          socket.emit("social:call-busy", { toUserId: payload.fromUserId });
          return;
        }

        setIncomingCall({
          fromUserId: payload.fromUserId,
          callType: payload.callType,
          caller: payload.caller,
        });
        startRingtone();
      },
    );

    socket.on("social:call-cancelled", (payload: { fromUserId: string }) => {
      if (!payload?.fromUserId) return;
      if (incomingCallRef.current?.fromUserId === payload.fromUserId) {
        setIncomingCall(null);
        stopRingtone();
      }
    });

    socket.on("social:call-busy", (payload: { fromUserId: string }) => {
      if (!payload?.fromUserId) return;
      if (activeCallRef.current?.peerId === payload.fromUserId) {
        messageApi.warning("Người dùng đang bận");
        setActiveCall(null);
        cleanupCallResources();
      }
    });

    socket.on("social:call-rejected", (payload: { fromUserId: string }) => {
      if (!payload?.fromUserId) return;
      if (activeCallRef.current?.peerId === payload.fromUserId) {
        messageApi.info("Cuộc gọi đã bị từ chối");
        setActiveCall(null);
        cleanupCallResources();
      }
    });

    socket.on("social:call-accepted", async (payload: { fromUserId: string; callType: CallType }) => {
      if (!payload?.fromUserId) return;
      const currentCall = activeCallRef.current;

      if (!currentCall || currentCall.peerId !== payload.fromUserId || currentCall.direction !== "outgoing") {
        return;
      }

      try {
        const peerConnection = peerConnectionRef.current || createPeerConnection(payload.fromUserId);
        const stream = await getOrCreateLocalStream(currentCall.callType);
        addLocalTracksToPeer(peerConnection, stream);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("social:call-offer", {
          toUserId: payload.fromUserId,
          offer,
        });

        setActiveCall((prev) => (prev ? { ...prev, status: "connecting" } : prev));
        stopRingtone();
      } catch (error) {
        console.error(error);
        messageApi.error("Không thể bắt đầu cuộc gọi");
        setActiveCall(null);
        cleanupCallResources();
      }
    });

    socket.on("social:call-offer", async (payload: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      if (!payload?.fromUserId || !payload?.offer) return;

      try {
        const currentCall = activeCallRef.current;
        if (!currentCall || currentCall.peerId !== payload.fromUserId) {
          socket.emit("social:call-rejected", {
            toUserId: payload.fromUserId,
            reason: "invalid-state",
          });
          return;
        }

        const peerConnection = peerConnectionRef.current || createPeerConnection(payload.fromUserId);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("social:call-answer", {
          toUserId: payload.fromUserId,
          answer,
        });

        setActiveCall((prev) => (prev ? { ...prev, status: "connecting" } : prev));
      } catch (error) {
        console.error(error);
        setActiveCall(null);
        cleanupCallResources();
      }
    });

    socket.on("social:call-answer", async (payload: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      if (!payload?.fromUserId || !payload?.answer) return;

      const currentCall = activeCallRef.current;
      if (!currentCall || currentCall.peerId !== payload.fromUserId) return;

      try {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) return;
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
        setActiveCall((prev) => (prev ? { ...prev, status: "connected" } : prev));
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("social:call-ice-candidate", async (payload: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (!payload?.fromUserId || !payload?.candidate) return;

      try {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) return;
        await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("social:call-ended", (payload: { fromUserId: string }) => {
      if (!payload?.fromUserId) return;
      if (activeCallRef.current?.peerId === payload.fromUserId) {
        messageApi.info("Cuộc gọi đã kết thúc");
        setActiveCall(null);
        cleanupCallResources();
      }
    });

    return () => {
      messageApi.destroy();
      Object.values(undoCountdownTimersRef.current).forEach((timerId) => {
        window.clearInterval(timerId);
      });
      undoCountdownTimersRef.current = {};
      cleanupCallResources();
      if (ringtoneContextRef.current) {
        void ringtoneContextRef.current.close();
        ringtoneContextRef.current = null;
      }
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeOrganizationId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeCall) return;
    const timer = window.setTimeout(() => {
      attachCurrentStreamsToVideos();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeCall]);

  const onSearch = (value: string) => {
    setSearchText(value);
    fetchUsers(value);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles((prev) => {
      const merged = [...prev, ...files].slice(0, 5);
      return merged;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSelectUser = (user: SocialUser) => {
    setSelectedUser(user);
  };

  const backToContacts = () => {
    setSelectedUser(null);
  };

  const sendMessage = async () => {
    if (!selectedUser || !token) return;

    const text = textMessage.trim();
    if (!text && selectedFiles.length === 0) {
      messageApi.warning("Vui lòng nhập tin nhắn hoặc chọn tệp");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("toUserId", selectedUser._id);
      formData.append("text", text);
      selectedFiles.forEach((file) => formData.append("attachments", file));

      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/social/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gửi tin nhắn thất bại");
      }

      const payload: SocialMessage = await res.json();
      setMessages((prev) => {
        const existed = prev.some((msg) => msg._id === payload._id);
        if (existed) return prev;
        return [...prev, payload];
      });

      setTextMessage("");
      setSelectedFiles([]);
    } catch (error: any) {
      console.error(error);
      messageApi.error(error.message || "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {contextHolder}
      {!isMobileChatView && (
        <Header
          title={mode === "admin" ? "Mạng xã hội nội bộ" : "Mạng xã hội người dùng"}
          subtitle={
            mode === "admin"
              ? "Tra cứu người dùng, trạng thái online/offline và nhắn tin realtime"
              : "Kết nối với quản trị viên và những người dùng khác trong hệ thống"
          }
          logo={RiWechatLine}
        />
      )}

      <div
        className={`grid grid-cols-1 md:grid-cols-[360px_1fr] ${
          isMobileChatView ? "h-[calc(100dvh-64px)] gap-0 p-0" : "h-[calc(100vh-210px)] gap-4 p-4"
        }`}
      >
        {(!isMobile || !selectedUser) && (
          <div
            className={`flex h-full flex-col overflow-hidden bg-[var(--surface-1)] ${
              isMobileChatView ? "rounded-none border-0" : "rounded-xl border border-[var(--border-color)]"
            }`}
          >
          <div className="border-b border-[var(--border-color)] p-3">
            <Input
              placeholder="Tìm theo tên, lớp, mã HS/GV, email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => onSearch(e.target.value)}
              allowClear
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingUsers ? (
              <div className="mt-6 flex justify-center">
                <Spin />
              </div>
            ) : users.length === 0 ? (
              <Empty description="Không có người dùng phù hợp" />
            ) : (
              <List
                dataSource={users}
                renderItem={(user) => {
                  const active = selectedUser?._id === user._id;

                  return (
                    <List.Item
                      className={`cursor-pointer rounded-lg border p-3 transition ${
                        active
                          ? "border-[var(--primary-color)] bg-[var(--surface-2)]"
                          : "border-transparent hover:border-[var(--border-color)]"
                      }`}
                      onClick={() => onSelectUser(user)}
                    >
                      <Space align="start" className="w-full">
                        <Badge color={user.isOnline ? "#52c41a" : "#8c8c8c"} dot>
                          <Avatar src={user.avatarUrl} icon={<UserOutlined />} />
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-[var(--text-color)]">
                            {user.fullName}
                          </div>
                          <div className="truncate text-xs text-[var(--text-muted)]">
                            {user.email}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Tag color="blue">{roleLabel[user.role] || user.role}</Tag>
                            {user.className && user.className !== "---" && (
                              <Tag color="cyan">{user.className}</Tag>
                            )}
                          </div>
                          <Text type="secondary" className="!text-xs">
                            {formatLastSeen(user.isOnline, user.lastSeenAt)}
                          </Text>
                        </div>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            )}
          </div>
          </div>
        )}

        {(!isMobile || selectedUser) && (
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-1)]">
          {selectedUser ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--border-color)] p-3">
                <Space>
                  {isMobile && (
                    <Button
                      type="text"
                      icon={<LeftOutlined />}
                      onClick={backToContacts}
                      className="!mr-1"
                    />
                  )}
                  <Badge color={selectedUser.isOnline ? "#52c41a" : "#8c8c8c"} dot>
                    <Avatar src={selectedUser.avatarUrl} icon={<UserOutlined />} />
                  </Badge>
                  <div>
                    <div className="font-semibold text-[var(--text-color)]">{selectedUser.fullName}</div>
                    <Text type="secondary" className="!text-xs">
                      {formatLastSeen(selectedUser.isOnline, selectedUser.lastSeenAt)}
                    </Text>
                  </div>
                </Space>

                <Space>
                  <Button
                    type="text"
                    icon={<PhoneOutlined />}
                    title="Gọi thoại"
                    onClick={() => startCall("audio")}
                    disabled={Boolean(activeCall && activeCall.peerId !== selectedUser._id)}
                  />
                  <Button
                    type="text"
                    icon={<VideoCameraOutlined />}
                    title="Gọi video"
                    onClick={() => startCall("video")}
                    disabled={Boolean(activeCall && activeCall.peerId !== selectedUser._id)}
                  />
                </Space>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {loadingMessages ? (
                  <div className="mt-8 flex justify-center">
                    <Spin />
                  </div>
                ) : messages.length === 0 ? (
                  <Empty description="Chưa có tin nhắn" />
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const mine = msg.sender._id === myId;
                      return (
                        <div key={msg._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 ${
                              mine
                                ? "bg-[var(--primary-color)] text-white"
                                : "bg-[var(--surface-2)] text-[var(--text-color)]"
                            }`}
                          >
                            {msg.recalled ? (
                              <div className="text-sm italic opacity-80">Tin nhắn đã được thu hồi</div>
                            ) : (
                              <>
                                {msg.text && <div className="whitespace-pre-wrap text-sm">{msg.text}</div>}

                                {msg.attachments?.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {msg.attachments.map((att) => {
                                      const isImage = att.mimeType?.startsWith("image/");

                                      return (
                                        <div key={att.publicId}>
                                          {isImage ? (
                                            <a href={att.url} target="_blank" rel="noreferrer">
                                              <img
                                                src={att.url}
                                                alt={att.fileName}
                                                className="max-h-40 rounded border border-[var(--border-color)]"
                                              />
                                            </a>
                                          ) : (
                                            <a
                                              href={att.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className={`inline-flex items-center gap-2 rounded px-2 py-1 text-xs ${
                                                mine ? "bg-white/20 text-white" : "bg-[var(--surface-3)]"
                                              }`}
                                            >
                                              <PaperClipOutlined /> {att.fileName}
                                            </a>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            )}

                            <div className="mt-1 flex items-center justify-end gap-2">
                              {mine && !msg.recalled && (
                                <Popconfirm
                                  title="Thu hồi tin nhắn"
                                  description="Bạn muốn thu hồi tin nhắn này?"
                                  okText="Thu hồi"
                                  cancelText="Hủy"
                                  onConfirm={() => recallMessage(msg._id)}
                                >
                                  <Button size="small" type="link" className="!h-auto !p-0 !text-white/80">
                                    Thu hồi
                                  </Button>
                                </Popconfirm>
                              )}

                              <div className={`text-right text-[11px] ${mine ? "text-white/80" : "text-[var(--text-muted)]"}`}>
                                {formatTime(msg.createdAt)}
                                {mine ? ` • ${getMyMessageStatusLabel(msg)}` : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messageEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border-color)] p-3">
                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <Tag
                        key={`${file.name}-${index}`}
                        closable
                        onClose={() => removeFile(index)}
                        color="processing"
                      >
                        {file.name}
                      </Tag>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={onFilesSelected}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <Button icon={<CloudUploadOutlined />} onClick={openFilePicker}>
                    Tệp
                  </Button>
                  <Input.TextArea
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    placeholder="Nhập tin nhắn..."
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sending}
                    onClick={sendMessage}
                    style={{ backgroundColor: "var(--primary-color)" }}
                  >
                    Gửi
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Empty description="Chọn một người dùng để bắt đầu trò chuyện" />
            </div>
          )}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(incomingCall)}
        onCancel={rejectIncomingCall}
        closable={false}
        footer={null}
        centered
        destroyOnClose
      >
        {incomingCall && (
          <div className="text-center">
            <Avatar size={64} src={incomingCall.caller.avatarUrl} icon={<UserOutlined />} />
            <div className="mt-3 text-lg font-semibold">{incomingCall.caller.fullName}</div>
            <div className="mt-1 text-sm text-[var(--text-muted)]">
              {incomingCall.callType === "video" ? "Cuộc gọi video đến" : "Cuộc gọi thoại đến"}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button danger onClick={rejectIncomingCall}>
                Từ chối
              </Button>
              <Button type="primary" onClick={acceptIncomingCall}>
                Nhấc máy
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(activeCall)}
        onCancel={cancelOutgoingCall}
        closable={false}
        footer={null}
        centered
        width={activeCall?.callType === "video" ? 860 : 420}
        destroyOnClose
      >
        {activeCall && (
          <div>
            <div className="mb-3 text-center">
              <div className="text-base font-semibold">{activeCall.peerName}</div>
              <div className="text-xs text-[var(--text-muted)]">
                {activeCall.status === "ringing"
                  ? "Đang đổ chuông..."
                  : activeCall.status === "connecting"
                    ? "Đang kết nối..."
                    : "Đang trò chuyện"}
              </div>
            </div>

            {activeCall.callType === "video" ? (
              <div className="relative h-[360px] overflow-hidden rounded-xl bg-black">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute bottom-3 right-3 h-24 w-36 rounded-lg border border-white/20 bg-black object-cover"
                />
              </div>
            ) : (
              <div className="flex h-[220px] flex-col items-center justify-center rounded-xl bg-[var(--surface-2)]">
                <Avatar size={88} src={activeCall.peerAvatar} icon={<UserOutlined />} />
                <div className="mt-3 text-sm text-[var(--text-muted)]">Cuộc gọi thoại</div>
                <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <Button danger icon={<PhoneOutlined />} onClick={cancelOutgoingCall}>
                Kết thúc
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SocialPage;
