export function fmtTime(total: number) {
    var hours = Math.floor(total / 60);
    var minutes = total % 60;
    
    return (hours==0) ? minutes+" m" : (minutes==0) ? hours+" h" : hours+" h "+minutes+" m";
}