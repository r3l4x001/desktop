import * as template from './folder-add-edit.component.html';

import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { FolderService } from 'jslib/abstractions/folder.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';

import { FolderView } from 'jslib/models/view/folderView';

@Component({
    selector: 'app-folder-add-edit',
    template: template,
})
export class FolderAddEditComponent implements OnInit {
    @Input() folderId: string;
    @Output() onSavedFolder = new EventEmitter<FolderView>();
    @Output() onDeletedFolder = new EventEmitter<FolderView>();

    editMode: boolean = false;
    folder: FolderView = new FolderView();
    title: string;
    formPromise: Promise<any>;
    deletePromise: Promise<any>;

    constructor(private folderService: FolderService, private i18nService: I18nService,
        private analytics: Angulartics2, private toasterService: ToasterService,
        private platformUtilsService: PlatformUtilsService) { }

    async ngOnInit() {
        this.editMode = this.folderId != null;

        if (this.editMode) {
            this.editMode = true;
            this.title = this.i18nService.t('editFolder');
            const folder = await this.folderService.get(this.folderId);
            this.folder = await folder.decrypt();
        } else {
            this.title = this.i18nService.t('addFolder');
        }
    }

    async submit() {
        if (this.folder.name == null || this.folder.name === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('nameRequired'));
            return;
        }

        try {
            const folder = await this.folderService.encrypt(this.folder);
            this.formPromise = this.folderService.saveWithServer(folder);
            await this.formPromise;
            this.analytics.eventTrack.next({ action: this.editMode ? 'Edited Folder' : 'Added Folder' });
            this.toasterService.popAsync('success', null,
                this.i18nService.t(this.editMode ? 'editedFolder' : 'addedFolder'));
            this.onSavedFolder.emit(this.folder);
        } catch { }
    }

    async delete() {
        const confirmed = await this.platformUtilsService.showDialog(
            this.i18nService.t('deleteFolderConfirmation'), this.i18nService.t('deleteFolder'),
            this.i18nService.t('yes'), this.i18nService.t('no'), 'warning');
        if (!confirmed) {
            return;
        }

        try {
            this.deletePromise = this.folderService.deleteWithServer(this.folder.id);
            await this.deletePromise;
            this.analytics.eventTrack.next({ action: 'Deleted Folder' });
            this.toasterService.popAsync('success', null, this.i18nService.t('deletedFolder'));
            this.onDeletedFolder.emit(this.folder);
        } catch { }
    }
}
