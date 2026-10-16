import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const Pending = () => <p role="status" className="form-note">Opening this page…</p>;
const NotFound = () => <section className="empty-panel"><h2>This page isn’t here.</h2><p>It may have moved. Head back to the Sky to find your way.</p><a href="/home" className="member-link">Back to the Sky</a></section>;

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: Pending,
    defaultPendingMs: 400,
    defaultNotFoundComponent: NotFound,
  });

  return router;
};
