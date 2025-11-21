import { useState, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useFetch = <T = any,>() => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (url: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(url, options);

      if (response.status === 404) {
        localStorage.removeItem("userInfo");
        window.location.replace("/notfound-404");
        return null;
      }

      if (response.status === 401) {
        localStorage.removeItem("userInfo");
        window.location.replace("/login");
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          setError(errorData.message);
          return errorData;
        }
        throw new Error(errorData.message || `Lỗi HTTP: ${response.status}`);
      }

      if (response.status === 204) {
        setData(null);
        return null;
      }

      const result: T = await response.json();
      setData(result);
      return result;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối hoặc xử lý dữ liệu.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, request };
};

export default useFetch;
