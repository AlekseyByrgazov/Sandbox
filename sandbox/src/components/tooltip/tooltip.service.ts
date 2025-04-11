import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class TooltipService {
    private _activeTooltipSubject = new Subject<string>()

    activeTooltip$ = this._activeTooltipSubject.asObservable();

    setActiveTooltip(id: string){
        this._activeTooltipSubject.next(id)
    }
}