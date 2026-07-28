import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

// Chart.js v4 requires every element/scale type you use to be registered
// once, globally, before any chart renders. Done here in one place so
// every dashboard chart component can just import "../lib/chartSetup"
// without repeating this boilerplate.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);