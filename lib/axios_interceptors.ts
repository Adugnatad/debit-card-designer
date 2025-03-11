import { axiosConfig } from "./axios";

export const updateAuthorizationHeader = async (token: any) => {
  if (token) {
    var formattedToken = token.replace(/['"]+/g, "");
    axiosConfig.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${formattedToken}`;
  } else {
    delete axiosConfig.defaults.headers.common["Authorization"];
  }

  axiosConfig.interceptors.request.use(
    (config: any) => {
      // You can inspect or modify the config here if needed
      return config;
    },
    (error: any) => {
      // Handle the error
      return Promise.reject(error);
    }
  );
};

// const setUpInterceptor = async () => {
//   axiosConfig.interceptors.request.use(
//     (config: any) => config,
//     (error: any) => Promise.reject(error)
//   );
// };

// export default setUpInterceptor;
