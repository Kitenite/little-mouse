// Offline preflight only; no assignment, settings mutation or telemetry is installed.
export function trialEligibility(trial, {settings, observed}) {
 const failures=[];
 for(const rule of trial.prerequisites){
  const [scope,key]=rule.field.split('.');
  const value=({settings,observed})[scope]?.[key];
  const valid=rule.operator==='eq'?value===rule.value:rule.operator==='gt'?typeof value==='number'&&Number.isFinite(value)&&value>rule.value:false;
  if(!valid)failures.push(rule.field);
 }
 return {eligible:failures.length===0,failures};
}
