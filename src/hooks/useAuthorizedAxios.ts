import axios, { type AxiosInstance } from "axios";
import { useState, useEffect } from "react";

const useAuthorizedAxios = (): AxiosInstance => {
  const [authorizedAxios, setAuthorizedAxios] = useState<AxiosInstance | null>(
    null,
  );

  useEffect(() => {
    const setupAxios = async () => {
      // Replace with your actual authorization logic
      const token = localStorage.getItem("token"); // Or however you store the token

      const instance = axios.create({
        baseURL: "https://assettoneestates.pythonanywhere.com/", // Or your API base URL
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAuthorizedAxios(instance);
    };

    setupAxios();
  }, []);

  return authorizedAxios!; // Non-null assertion, ensure axios is setup
};

export { useAuthorizedAxios };
