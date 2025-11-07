class Todo {
    constructor({ element_listy, element_tekstu, element_daty, element_wyszukiwarki, storageKey = "zadanie" }) {
        this.element_listy = element_listy;
        this.element_tekstu = element_tekstu;
        this.element_daty = element_daty;
        this.element_wyszukiwarki = element_wyszukiwarki;
        this.storageKey = storageKey;

        // dane wczytywane
        this.tasks = this.load();

        // zmienne pomocnicze
        this.fragment_wyszukiwania = "";
        this.id_tymczasowe = null; // id zadania w trybie edycji
        this._klik_out = (input) => this.gdy_przycisk_poza(input);

        // nasłuchiwacze
        this.element_listy.addEventListener("click", (e) => this.gdy_przycisk_na_lista(e));
        this.element_wyszukiwarki.addEventListener("input", () => {
            const wartosc = this.element_wyszukiwarki.value.trim();
            this.fragment_wyszukiwania = wartosc.length >= 2 ? wartosc : "";
            this.draw();
        });

        // pierwszy render
        this.draw();
    }

    //=====================================================
    load() {
        const raw = localStorage.getItem(this.storageKey);
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }
    draw() {
        this.element_listy.innerHTML = "";
        const x = this.filteredTasks;

        for (const t of x) {
            const li = document.createElement("li");
            li.className = "element_todo";
            li.dataset.id = t.id;

            const tekst_HTML = this.fragment_wyszukiwania.length >= 2
                ? this.podswietl(t.tresc_zadania, this.fragment_wyszukiwania)
                : this.escape(t.tresc_zadania);

            const data_HTML = t.data_zadania
                ? ` <span class="element_data">(${
                    this.fragment_wyszukiwania.length >= 2
                        ? this.podswietl(t.data_zadania, this.fragment_wyszukiwania)
                        : this.escape(t.data_zadania)
                })</span>`
                : "";

            li.innerHTML = `
                <div class="todo_main" data-role="editable-area">
                    <span class="element_text">${tekst_HTML}</span>${data_HTML}
                </div>
                <div class="controls">
                    <button class="btn-small btn-danger" data-action="remove">Usuń</button>
                </div>
            `;

            if (this.id_tymczasowe === t.id) { this.edytor_w_liscie(li, t);}
            this.element_listy.appendChild(li);
        }
    }
    get filteredTasks() {
        const p = this.fragment_wyszukiwania.toLowerCase();
        if (!p) return this.tasks;
        return this.tasks.filter(t =>
            t.tresc_zadania.toLowerCase().includes(p) ||
            (t.data_zadania || "").toLowerCase().includes(p)
        );
    }
    dodaj_zadanie(tresc_zadania, data_zadania = "") {
        if (!this.sprawdzanie_poprawnosci(tresc_zadania, data_zadania)) return;
        this.tasks.push({
            id: crypto.randomUUID(),
            tresc_zadania: tresc_zadania.trim(),
            data_zadania,
        });
        this.save();
        this.draw();
    }
    podswietl(t, q) {
        const esq_q = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`(${esq_q})`, "gi");
        return this.escape(t).replace(re, '<span class="highlight">$1</span>');
    }
    escape(s) {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
    escapeAttr(s) {
        return this.escape(String(s)).replaceAll("\n", " ");
    }
    edytor_w_liscie(li, task) {
        li.classList.add("editing");

        const editor = document.createElement("div");
        editor.className = "inline-editor";
        editor.innerHTML = `
          <input class="edit-text" type="text" value="${this.escapeAttr(task.tresc_zadania)}" maxlength="255" />
          <input class="edit-date" type="date" value="${this.escapeAttr(task.data_zadania || "")}" />
        `;

        const main = li.querySelector(".todo_main");
        main.replaceWith(editor);

        const inputText = editor.querySelector(".edit-text");
        const inputDate = editor.querySelector(".edit-date");

        inputText.focus();
        inputText.setSelectionRange(inputText.value.length, inputText.value.length);

        const onKeyDown = (e) => {
            if (e.key === "Enter") { this.potwierdz_edytor_w_liscie(task.id, inputText.value, inputDate.value); }
            else if (e.key === "Escape") { this.anuluj_edytor_w_liscie(); }
        };
        inputText.addEventListener("keydown", onKeyDown);
        inputDate.addEventListener("keydown", onKeyDown);

        this.sprawdz_przysik_poza_start(li, task);
    }
    potwierdz_edytor_w_liscie(id, tekst, data) {
        if (!this.sprawdzanie_poprawnosci(tekst, data)) return;
        this.sprawdz_przysik_poza_stop();
        this.id_tymczasowe = null;
        this.edytuj(id, tekst, data);
    }
    anuluj_edytor_w_liscie() {
        this.sprawdz_przysik_poza_stop();
        this.edytowane_id = null;
        this.draw();
    }
    sprawdz_przysik_poza_start(li, zadanie) {
        this.sprawdz_przysik_poza_stop();
        this.edytowany_element = li;
        this.edytowane_id = zadanie.id;
        document.addEventListener("mousedown", this._klik_out, true);
    }
    sprawdzanie_poprawnosci(tresc_zadania, data_zadania) {
        const edytowany_tekst = (tresc_zadania ?? "").trim();

        if (edytowany_tekst.length < 3) {
            alert("Wpisz co najmniej 3 znaki");
            return false;
        }
        if (edytowany_tekst.length > 255) {
            alert("Nie może przekraczać 255 znaków");
            return false;
        }

        if (!data_zadania) { return true; }

        const teraz = new Date(); teraz.setHours(0, 0, 0, 0);
        const data_wpisania = new Date(data_zadania + "T00:00:00");

        if (data_wpisania < teraz) {
            alert("Data nie może być w przeszłości");
            return false;
        }
        return true;
    }
    sprawdz_przysik_poza_stop() {
        document.removeEventListener("mousedown", this._klik_out, true);
        this.edytowany_element = null;
        this.edytowane_id = null;
    }
    edytuj(id, tekst, data) {
        const t = this.tasks.find(t => t.id === id);
        if (!t) return;
        if (!this.sprawdzanie_poprawnosci(tekst, data)) return;
        t.tresc_zadania = tekst.trim();
        t.data_zadania = data.trim();
        this.save();
        this.draw();
    }
    gdy_przycisk_poza(e) {
        if (!this.edytowany_element) return;
        if (!this.edytowany_element.contains(e.target)) {
            const textEl = this.edytowany_element.querySelector(".edit-text");
            const dateEl = this.edytowany_element.querySelector(".edit-date");
            this.potwierdz_edytor_w_liscie(this.edytowane_id,textEl?.value ?? "",dateEl?.value ?? "");
        }
    }
    gdy_przycisk_na_lista(e) {
        const przycisk = e.target.closest("button[data-action]");
        if (przycisk) {
            const li = przycisk.closest(".element_todo");
            if (!li) return;
            const id = li.dataset.id;
            const akcja = przycisk.dataset.action;
            if (akcja === "remove") return this.usun(id);
            return;
        }

        // kliknięcie w obszar edytowalny – uruchom edycję inline
        const obszar_edycji = e.target.closest("[data-role='editable-area'], .element_text, .element_data, .todo_main");
        const rzad = e.target.closest(".element_todo");
        if (obszar_edycji && rzad) {
            const id = rzad.dataset.id;
            this.edytor_w_liscie_wlacz(id);
        }
    }
    usun(id) {
        if (this.id_tymczasowe === id) this.sprawdz_przysik_poza_stop();
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        this.draw();
    }
    edytor_w_liscie_wlacz(id) {
        if (this.id_tymczasowe === id) return;
        this.id_tymczasowe = id;
        this.draw();
    }

}

// --- init ---
document.addEventListener("DOMContentLoaded", () => {
    const element_listy = document.getElementById("itemList");
    const element_tekstu = document.getElementById("itemText");
    const element_daty = document.getElementById("itemDate");
    const element_wyszukiwarki = document.getElementById("searchInput");

    const todo = new Todo({
        element_listy,
        element_tekstu,
        element_daty,
        element_wyszukiwarki,
        storageKey: "zadanie"
    });

    const element_dodaj = document.getElementById("addForm");
    element_dodaj.addEventListener("submit", (e) => {
        const tresc_zadania = element_tekstu.value.trim();
        const data_zadania = element_daty.value;
        todo.dodaj_zadanie(tresc_zadania, data_zadania);
    });
});
