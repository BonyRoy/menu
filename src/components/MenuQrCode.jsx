import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import QRCode from "qrcode";
import { Download01 } from "@untitledui/icons";

export default function MenuQrCode({ restaurantId, restaurantName }) {
  const [dataUrl, setDataUrl] = useState("");
  const menuUrl = `${window.location.origin}/menu/${restaurantId}`;

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(menuUrl, {
      width: 240,
      margin: 1,
      color: { dark: "#161210", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not generate QR code");
      });

    return () => {
      cancelled = true;
    };
  }, [menuUrl]);

  const downloadQr = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    const safeName = (restaurantName || "menu")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    link.href = dataUrl;
    link.download = `${safeName || "menu"}-qr.png`;
    link.click();
    toast.success("QR code downloaded");
  };

  return (
    <div className="menu-qr">
      <div className="menu-qr__frame">
        {dataUrl ? (
          <img src={dataUrl} alt={`QR code for ${restaurantName}`} />
        ) : (
          <span className="menu-qr__loading">QR…</span>
        )}
      </div>
      <button
        type="button"
        className="menu-qr__download"
        onClick={downloadQr}
        disabled={!dataUrl}
        title="Download QR code"
      >
        <Download01 />
        Download QR
      </button>
    </div>
  );
}
