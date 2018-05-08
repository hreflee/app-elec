export default function (origin, target) {
  origin.splice(0, origin.length, ...target);
}
